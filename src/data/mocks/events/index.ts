import { DateTime, Effect, Ref, Schema } from "effect";
import { HttpServerResponse } from "effect/http";
import {
  CancelMessageOutcome,
  ContextUsage,
  SendNowOutcome,
} from "../../events/events.ts";
import { fields, missing } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people, threads } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  emptyContextUsage,
  type MessageVersionRow,
  messageVersions,
  outline,
  type StoredEvent,
  sampleContextUsage,
  seedEvents,
} from "./fixtures.ts";
import { threadStateSeeds } from "./thread-states.ts";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const EventsMock = mockGroup("events", (handlers) =>
  Effect.gen(function* () {
    const eventsRef = yield* Ref.make<ReadonlyArray<StoredEvent>>(seedEvents);
    const versionsRef =
      yield* Ref.make<
        Readonly<Record<string, ReadonlyArray<MessageVersionRow>>>
      >(messageVersions);

    const threadExists = (jamId: string) =>
      Object.values(threads).some((thread) => thread.id === jamId)
        ? Effect.void
        : missing("captains", jamId);

    const findEvent = (eventId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(eventsRef);
        const row = rows.find((candidate) => candidate.id === eventId);
        if (!row) {
          return yield* Effect.die(
            new Error(`events.messages: no row ${eventId}`),
          );
        }
        return row;
      });

    const patch = (eventId: string, patchValue: Partial<StoredEvent>) =>
      Effect.gen(function* () {
        const row = yield* findEvent(eventId);
        const updated = { ...row, ...patchValue };
        yield* Ref.set(
          eventsRef,
          (yield* Ref.get(eventsRef)).map((candidate) =>
            candidate.id === eventId ? updated : candidate,
          ),
        );
        return updated;
      });

    return handlers
      .handle("compact", ({ params }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const event: StoredEvent = {
            id: `evt_mock_compact_${params.jamId}`,
            jamId: params.jamId,
            kind: "compact",
            state: "committed",
            actorId: people.alex.id,
            createdAt: DateTime.formatIso(minutesAgo(0)),
            summary: "Compacted the checkout retry discussion.",
          };
          yield* Ref.update(eventsRef, (rows) => [...rows, event]);
          return { id: event.id, deduped: false };
        }),
      )
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const input = fields(query);
          const rows = (yield* Ref.get(eventsRef)).filter(
            (row) => row.jamId === params.jamId,
          );
          const stateRows = threadStateSeeds.filter(
            (row) => row.jamId === params.jamId,
          );
          const offset = Number(text(input.offset) ?? 0);
          const limit = Number(text(input.limit) ?? rows.length);
          const page = rows.slice(
            Number.isFinite(offset) ? offset : 0,
            Number.isFinite(limit) ? offset + limit : undefined,
          );
          return {
            items: [...page, ...stateRows],
            cursor: page.length > 0 ? page.at(-1)?.id : null,
            serverNow: DateTime.formatIso(minutesAgo(0)),
          };
        }),
      )
      .handle("contextUsage", ({ params }) =>
        threadExists(params.jamId).pipe(
          Effect.map(() =>
            Schema.decodeUnknownSync(ContextUsage)(
              sampleContextUsage[params.jamId] ?? emptyContextUsage,
            ),
          ),
        ),
      )
      .handle("outline", ({ params }) =>
        threadExists(params.jamId).pipe(
          Effect.as(
            outline.map((section) => ({
              ...section,
              jamId: params.jamId,
            })),
          ),
        ),
      )
      .handle("stream", ({ params, query }) => {
        const input = fields(query);
        const after = text(input.after);
        const rows = [...seedEvents, ...threadStateSeeds].filter(
          (row) =>
            row.jamId === params.jamId &&
            (after === undefined || row.id > after),
        );
        const frames = [
          {
            kind: "page",
            serverNow: DateTime.formatIso(minutesAgo(0)),
          },
          ...rows.map((item) => ({ kind: "event", item })),
          {
            kind: "end",
            cursor: rows.at(-1)?.id ?? null,
            avatarUrls: {
              [people.alex.id]: "https://example.com/avatars/alex.png",
            },
          },
        ];
        const body = `${frames.map((frame) => JSON.stringify(frame)).join("\n")}\n`;
        return Effect.succeed(
          HttpServerResponse.raw(body, {
            headers: { "content-type": "application/x-ndjson" },
          }),
        );
      })
      .handle("interrupt", ({ params }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const row: StoredEvent = {
            id: `evt_mock_interrupt_${params.jamId}`,
            jamId: params.jamId,
            kind: "control",
            state: "committed",
            actorId: people.alex.id,
            createdAt: DateTime.formatIso(minutesAgo(0)),
            command: "interrupt",
          };
          yield* Ref.update(eventsRef, (rows) => [...rows, row]);
          return { id: row.id, deduped: false };
        }),
      )
      .handle("message", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const input = fields(payload);
          const textValue = text(input.text) ?? "";
          const existing = (yield* Ref.get(eventsRef)).find(
            (row) =>
              row.jamId === params.jamId &&
              row.kind === "message" &&
              row.text === textValue,
          );
          if (existing) return { id: existing.id, deduped: true };
          const row: StoredEvent = {
            id: `evt_mock_message_${params.jamId}_${Math.abs(hash(textValue))}`,
            jamId: params.jamId,
            kind: "message",
            state: "queued",
            actorId: people.alex.id,
            createdAt: DateTime.formatIso(minutesAgo(0)),
            text: textValue,
          };
          yield* Ref.update(eventsRef, (rows) => [...rows, row]);
          yield* Ref.update(versionsRef, (rows) => ({
            ...rows,
            [row.id]: [
              {
                id: row.id,
                text: textValue,
                createdAt: row.createdAt,
                live: true,
              },
            ],
          }));
          return { id: row.id, deduped: false };
        }),
      )
      .handle("cancelMessage", ({ params }) =>
        patch(params.eventId, { state: "cancelled" }).pipe(
          Effect.map(
            (row) =>
              new CancelMessageOutcome({
                outcome: row.state === "cancelled" ? "cancelled" : "tooLate",
              }),
          ),
        ),
      )
      .handle("sendNowMessage", ({ params }) =>
        patch(params.eventId, { state: "streaming" }).pipe(
          Effect.map(
            (row) =>
              new SendNowOutcome({
                outcome:
                  row.state === "committed" || row.state === "cancelled"
                    ? "tooLate"
                    : "sent",
                id: "evt_sample_queued000000000" as unknown as SendNowOutcome["id"],
              }),
          ),
        ),
      )
      .handle("messageVersions", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findEvent(params.eventId);
          const versions = (yield* Ref.get(versionsRef))[row.id] ?? [
            {
              id: row.id,
              text: row.text ?? "",
              createdAt: row.createdAt,
              live: true,
            },
          ];
          return { root: row.id, versions };
        }),
      );
  }),
);

const hash = (value: string): number => {
  let result = 0;
  for (const character of value) {
    result = (result * 31 + character.charCodeAt(0)) | 0;
  }
  return result;
};
