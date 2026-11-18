import { DateTime, Effect, Ref, Schema } from "effect";
import { HttpServerResponse } from "effect/http";
import type { EventRowEncoded } from "../../events/events.ts";
import {
  CancelMessageOutcome,
  ContextUsage,
  SendNowOutcome,
} from "../../events/events.ts";
import { fields, MockDb } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { eventId } from "./event-ids.ts";
import {
  emptyContextUsage,
  type MessageVersionRow,
  messageVersions,
  outline,
  sampleContextUsage,
  seedEvents,
} from "./fixtures.ts";
import { threadStateSeeds } from "./thread-states.ts";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/** The text of a stored message row, or nothing for any other kind. */
const messageText = (row: EventRowEncoded) =>
  row.kind === "message" && "payload" in row ? row.payload.text : undefined;

/** The client key a send carried, so a resend of the same gesture is one row. */
const messageClientKey = (row: EventRowEncoded) =>
  row.kind === "message" && "payload" in row
    ? row.payload.clientKey
    : undefined;

/**
 * The delivery the submit gesture asked for: steer for a plain send, queue for
 * one held until the run ends. An unknown value falls back to steer, as Capy's
 * server does when the client names no gesture.
 */
const deliveryOf = (value: unknown) =>
  value === "queue" || value === "interrupt" ? value : "steer";

/** Where the rows this mock appends are kept, so a reload reads them back. */
const STORED_ROWS_KEY = "kiki.mock.events.rows";

/** The rows an earlier page load appended; a browser keeps them for us. */
const storedRows = (): ReadonlyArray<EventRowEncoded> => {
  const store = globalThis.localStorage;
  if (store === undefined) return [];
  try {
    const raw = store.getItem(STORED_ROWS_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (row): row is EventRowEncoded =>
            typeof row === "object" && row !== null && "id" in row,
        )
      : [];
  } catch {
    return [];
  }
};

const rememberRows = (rows: ReadonlyArray<EventRowEncoded>) => {
  const store = globalThis.localStorage;
  if (store === undefined) return;
  try {
    store.setItem(STORED_ROWS_KEY, JSON.stringify(rows.slice(-50)));
  } catch {
    // A full or blocked store only costs the reload, never the send.
  }
};

export const EventsMock = mockGroup("events", (handlers) =>
  Effect.gen(function* () {
    const kept = storedRows();
    const keptRef = yield* Ref.make<ReadonlyArray<EventRowEncoded>>(kept);
    const eventsRef = yield* Ref.make<ReadonlyArray<EventRowEncoded>>([
      ...seedEvents,
      ...kept,
    ]);
    const mintedRef = yield* Ref.make(kept.length);
    const versionsRef =
      yield* Ref.make<
        Readonly<Record<string, ReadonlyArray<MessageVersionRow>>>
      >(messageVersions);

    const { jams } = yield* MockDb;

    /**
     * Whether the jam is one the rest of the app can open: the fixture threads,
     * a Captain's thread, or a jam another group created this session. Reading
     * the shared store keeps this group and the threads group from disagreeing
     * about an id the sidebar happily links.
     */
    const threadExists = (jamId: string) =>
      Ref.get(jams).pipe(
        Effect.flatMap((rows) =>
          rows.some((row) => row.id === jamId)
            ? Effect.void
            : Effect.die(new Error(`events: no jam ${jamId}`)),
        ),
      );

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

    const setState = (id: string, state: EventRowEncoded["state"]) =>
      Effect.gen(function* () {
        const row = yield* findEvent(id);
        const updated = { ...row, state } as EventRowEncoded;
        yield* Ref.set(
          eventsRef,
          (yield* Ref.get(eventsRef)).map((candidate) =>
            candidate.id === id ? updated : candidate,
          ),
        );
        return updated;
      });

    /** Appends a row and keeps it, so the next page load still has it. */
    const appendRow = (row: EventRowEncoded) =>
      Effect.gen(function* () {
        yield* Ref.update(eventsRef, (rows) => [...rows, row]);
        const kept = yield* Ref.updateAndGet(keptRef, (rows) => [...rows, row]);
        rememberRows(kept);
      });

    /** A fresh id for a row a mutation appends, in the same shape as the seeds. */
    const mintId = Effect.gen(function* () {
      const minted = yield* Ref.updateAndGet(mintedRef, (count) => count + 1);
      return eventId(DateTime.formatIso(minutesAgo(0)), 900 + minted);
    });

    /**
     * The mock's answer to a sent message: one tool step and a closing reply, so
     * a conversation reads start to finish instead of ending on a work group.
     */
    const answer = (jamId: string, messageId: string, sent: string) =>
      Effect.gen(function* () {
        const now = DateTime.formatIso(minutesAgo(0));
        const model = {
          modelId: "anthropic/claude-sample",
          providerModelId: "claude-sample",
          reasoningMode: "medium" as const,
        };
        const turn = (
          id: string,
          blocks: ReadonlyArray<object>,
          stopReason: "tool_use" | "end_turn",
        ) =>
          ({
            id,
            jamId,
            kind: "assistant",
            state: "committed",
            createdAt: now,
            payload: {
              actor: { type: "agent", jamId },
              origin: { type: "system" },
              model,
              route: { source: "capy" },
              usage: {
                inputTokens: 1_200,
                outputTokens: 180,
                cacheReadTokens: 0,
                cacheWriteTokens: 0,
              },
              stopReason,
              startedAt: now,
              blocks,
            },
          }) as EventRowEncoded;
        const toolCallId = `toolu_mock_${messageId}`;
        const stepId = yield* mintId;
        yield* appendRow(
          turn(
            stepId,
            [
              {
                id: `blk_mock_read_${messageId}`,
                type: "tool_use",
                toolCallId,
                toolName: "read",
                args: { path: "src/checkout/retry.ts" },
              },
            ],
            "tool_use",
          ),
        );
        yield* appendRow({
          id: yield* mintId,
          jamId,
          kind: "tool_result",
          state: "committed",
          createdAt: now,
          payload: {
            actor: { type: "agent", jamId },
            origin: { type: "system" },
            toolCallId,
            isError: false,
            blocks: [{ type: "text", text: "Read 84 lines." }],
            data: { path: "src/checkout/retry.ts" },
          },
        } as EventRowEncoded);
        const asked = sent.trim().split("\n")[0] ?? "";
        const quoted =
          asked.length > 60 ? `${asked.slice(0, 59).trimEnd()}…` : asked;
        const replyId = yield* mintId;
        yield* appendRow(
          turn(
            replyId,
            [
              {
                id: `blk_mock_reply_${messageId}`,
                type: "text",
                text: `On it — “${quoted}” is queued. I read the retry path first, and the next step is the one that changes behaviour.`,
              },
            ],
            "end_turn",
          ),
        );
        yield* setState(messageId, "answered");
      });

    return handlers
      .handle("compact", ({ params }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const rows = yield* Ref.get(eventsRef);
          const jamRows = rows.filter((row) => row.jamId === params.jamId);
          const event = {
            id: yield* mintId,
            jamId: params.jamId,
            kind: "compact",
            state: "committed",
            createdAt: DateTime.formatIso(minutesAgo(0)),
            payload: {
              actor: { type: "user", userId: people.alex.id },
              origin: { type: "web", userId: people.alex.id },
              summary: "Compacted the checkout retry discussion.",
              throughEventId: jamRows.at(-1)?.id ?? "",
              triggeredBy: "manual",
            },
          } as EventRowEncoded;
          yield* appendRow(event);
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
          const row = {
            id: yield* mintId,
            jamId: params.jamId,
            kind: "control",
            state: "committed",
            createdAt: DateTime.formatIso(minutesAgo(0)),
            payload: {
              actor: { type: "user", userId: people.alex.id },
              origin: { type: "web", userId: people.alex.id },
              command: { type: "stop" },
            },
          } as EventRowEncoded;
          yield* appendRow(row);
          return { id: row.id, deduped: false };
        }),
      )
      .handle("message", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* threadExists(params.jamId);
          const input = fields(payload);
          const textValue = text(input.text) ?? "";
          const clientKey = text(input.clientKey);
          const existing = (yield* Ref.get(eventsRef)).find(
            (row) =>
              row.jamId === params.jamId &&
              (clientKey === undefined
                ? messageText(row) === textValue &&
                  messageClientKey(row) === undefined
                : messageClientKey(row) === clientKey),
          );
          if (existing) return { id: existing.id, deduped: true };
          const row = {
            id: yield* mintId,
            jamId: params.jamId,
            kind: "message",
            state: "pending",
            createdAt: DateTime.formatIso(minutesAgo(0)),
            payload: {
              actor: { type: "user", userId: people.alex.id },
              origin: { type: "web", userId: people.alex.id },
              text: textValue,
              files: [],
              delivery: deliveryOf(input.delivery),
              ...(clientKey === undefined ? {} : { clientKey }),
            },
          } as EventRowEncoded;
          yield* appendRow(row);
          yield* answer(params.jamId, row.id, textValue);
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
        setState(params.eventId, "cancelled").pipe(
          Effect.map(
            (row) =>
              new CancelMessageOutcome({
                outcome: row.state === "cancelled" ? "cancelled" : "tooLate",
              }),
          ),
        ),
      )
      .handle("sendNowMessage", ({ params }) =>
        Effect.gen(function* () {
          const before = yield* findEvent(params.eventId);
          const row = yield* setState(params.eventId, "committed");
          return new SendNowOutcome({
            outcome:
              before.state === "committed" || before.state === "cancelled"
                ? "tooLate"
                : "sent",
            id: row.id as unknown as SendNowOutcome["id"],
          });
        }),
      )
      .handle("messageVersions", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findEvent(params.eventId);
          const versions = (yield* Ref.get(versionsRef))[row.id] ?? [
            {
              id: row.id,
              text: messageText(row) ?? "",
              createdAt: row.createdAt,
              live: true,
            },
          ];
          return { root: row.id, versions };
        }),
      );
  }),
);
