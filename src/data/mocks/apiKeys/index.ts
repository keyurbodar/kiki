import { Effect, Ref } from "effect";
import {
  type Row as DbRow,
  fields,
  MockDb,
  missing,
  newId,
} from "../db/MockDb.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { apiKeyDefaults } from "./fixtures.ts";

type Row = Record<string, unknown>;

const string = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const ApiKeysMock = mockGroup("apiKeys", (handlers) =>
  Effect.gen(function* () {
    const { apiKeys, members } = yield* MockDb;
    const findRow = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(apiKeys);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) return yield* missing("apiKeys", id);
        return row;
      });

    const replaceRow = (id: string, change: (row: Row) => Row) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(apiKeys);
        if (!rows.some((row) => row.id === id)) {
          return yield* missing("apiKeys", id);
        }
        const updated = rows.map((row) => (row.id === id ? change(row) : row));
        yield* Ref.set(apiKeys, updated as typeof rows);
        return updated.find((row) => row.id === id)!;
      });

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(apiKeys);
          const knownMembers = yield* Ref.get(members);
          return rows.map((row) => ({
            ...row,
            revoked: row.revokedAt !== null,
            createdByEmail:
              knownMembers.find((member) => member.id === row.createdBy)
                ?.email ?? null,
          }));
        }),
      )
      .handle("mint", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const id = newId("key");
          const prefix = `${apiKeyDefaults.prefix}_${id.slice(-4)}`;
          const row: DbRow<"apiKeys"> = {
            id,
            name: string(input.name) ?? "New API key",
            prefix,
            createdBy: people.alex.id,
            createdAt: isoMinutesAgo(0),
            lastUsedAt: isoMinutesAgo(0),
            revokedAt: null,
          };
          yield* Ref.update(apiKeys, (rows) => [row, ...rows]);
          const token = `${prefix}_sample_token`;
          return { ...row, token, revoked: false };
        }),
      )
      .handle("rename", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findRow(params.keyId);
          const input = fields(payload);
          const name = string(input.name) ?? "Renamed API key";
          return yield* replaceRow(params.keyId, (row) => ({
            ...row,
            name,
            renamedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("revoke", ({ params }) =>
        Effect.gen(function* () {
          yield* findRow(params.keyId);
          const revokedAt = isoMinutesAgo(0);
          const row = yield* replaceRow(params.keyId, (current) => ({
            ...current,
            revokedAt,
          }));
          return { ...row, revoked: true, ok: true };
        }),
      );
  }),
);
