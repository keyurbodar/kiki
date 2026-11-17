import { DateTime, Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { type MemoryRow, memories } from "./fixtures.ts";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const MemoryMock = mockGroup("memory", (handlers) =>
  Effect.gen(function* () {
    const memoryRef = yield* Ref.make<ReadonlyArray<MemoryRow>>(memories);

    const find = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(memoryRef);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) {
          return yield* Effect.die(new Error(`memory.entries: no row ${id}`));
        }
        return row;
      });

    const withStatus = (row: MemoryRow, status: MemoryRow["status"]) => ({
      ...row,
      status,
      forgottenAt:
        status === "forgotten" ? DateTime.formatIso(minutesAgo(0)) : null,
      updatedAt: DateTime.formatIso(minutesAgo(0)),
    });

    const setStatus = (id: string, status: MemoryRow["status"]) =>
      Effect.gen(function* () {
        const row = yield* find(id);
        const updated = withStatus(row, status);
        yield* Ref.set(
          memoryRef,
          (yield* Ref.get(memoryRef)).map((candidate) =>
            candidate.id === id ? updated : candidate,
          ),
        );
        const { forgottenAt: _forgottenAt, ...withoutForgottenAt } = updated;
        return withoutForgottenAt;
      });

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          const search = text(input.search)?.toLowerCase();
          const status = text(input.status) ?? "active";
          const rows = (yield* Ref.get(memoryRef)).filter((row) => {
            if (row.status !== status) return false;
            return search
              ? row.title.toLowerCase().includes(search) ||
                  row.body.toLowerCase().includes(search)
              : true;
          });
          return rows.map(({ forgottenAt: _forgottenAt, ...row }) => row);
        }),
      )
      .handle("read", ({ params }) =>
        find(params.volumeId).pipe(
          Effect.map(({ forgottenAt: _forgottenAt, ...row }) => row),
        ),
      )
      .handle("edit", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* find(params.volumeId);
          const input = fields(payload);
          const title = text(input.title);
          const body = text(input.body);
          const scope = text(input.scope);
          const updated: MemoryRow = {
            ...current,
            ...(title ? { title } : {}),
            ...(body ? { body } : {}),
            ...(scope ? { scope } : {}),
            authorId: text(input.authorId) ?? people.alex.id,
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.set(
            memoryRef,
            (yield* Ref.get(memoryRef)).map((row) =>
              row.id === current.id ? updated : row,
            ),
          );
          const { forgottenAt: _forgottenAt, ...visible } = updated;
          return visible;
        }),
      )
      .handle("forget", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const reason = text(input.reason) ?? "No longer relevant";
          const row = yield* setStatus(params.volumeId, "forgotten");
          return {
            ...row,
            reason,
            forgottenAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("restore", ({ params }) => setStatus(params.volumeId, "active"));
  }),
);
