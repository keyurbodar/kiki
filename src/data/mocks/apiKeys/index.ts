import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleKeyName, sampleKeyPrefix } from "./fixtures.ts";

export const ApiKeysMock = mockGroup("apiKeys", (handlers) =>
  Effect.gen(function* () {
    const { apiKeys } = yield* MockDb;

    const requireKey = (keyId: string) =>
      Effect.flatMap(Ref.get(apiKeys), (rows) => {
        const key = rows.find((row) => row.id === keyId);
        return key ? Effect.succeed(key) : missing("apiKeys", keyId);
      });

    return handlers
      .handle("mint", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const key = {
            id: newId("key"),
            name:
              typeof input.name === "string" && input.name.length > 0
                ? input.name
                : sampleKeyName,
            prefix: sampleKeyPrefix,
            createdBy:
              typeof input.createdBy === "string"
                ? input.createdBy
                : "user_sample_alex",
            createdAt: isoMinutesAgo(0),
            lastUsedAt: isoMinutesAgo(0),
            revokedAt: null,
          };
          yield* Ref.update(apiKeys, (rows) => [...rows, key]);
          return key;
        }),
      )
      .handle("list", () => Ref.get(apiKeys))
      .handle("rename", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* requireKey(params.keyId);
          const input = fields(payload);
          const name =
            typeof input.name === "string" && input.name.length > 0
              ? input.name
              : sampleKeyName;
          const rows = yield* Ref.get(apiKeys);
          const updated = rows.map((row) =>
            row.id === params.keyId ? { ...row, name } : row,
          );
          yield* Ref.set(apiKeys, updated);
          return updated.find((row) => row.id === params.keyId);
        }),
      )
      .handle("revoke", ({ params }) =>
        Effect.gen(function* () {
          yield* requireKey(params.keyId);
          const revokedAt = isoMinutesAgo(0);
          const rows = yield* Ref.get(apiKeys);
          const updated = rows.map((row) =>
            row.id === params.keyId ? { ...row, revokedAt } : row,
          );
          yield* Ref.set(apiKeys, updated);
          return { ok: true, id: params.keyId, revokedAt };
        }),
      );
  }),
);
