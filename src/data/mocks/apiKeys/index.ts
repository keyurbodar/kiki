import { DateTime, Effect, Ref } from "effect";
import {
  ApiKey,
  type ApiKeyId,
  ApiKeyNotFound,
  MintedApiKey,
} from "../../api/schemas/api-keys.ts";
import { UserId } from "../../api/schemas/ids.ts";
import { newId } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleServiceUsers } from "../serviceUsers/fixtures.ts";
import { serviceKeys, tokenHintFor, worldKeys } from "./fixtures.ts";

const releaseBot = sampleServiceUsers[0]?.id;

export const sampleApiKeys = [
  ...worldKeys,
  ...(releaseBot === undefined ? [] : serviceKeys(releaseBot)),
];

export const ApiKeysMock = mockGroup("apiKeys", (handlers) =>
  Effect.gen(function* () {
    const keys = yield* Ref.make<ReadonlyArray<ApiKey>>(sampleApiKeys);

    const update = (keyId: ApiKeyId, change: (key: ApiKey) => ApiKey) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(keys);
        const current = rows.find((row) => row.id === keyId);
        if (!current) return yield* Effect.fail(new ApiKeyNotFound({ keyId }));
        const next = change(current);
        yield* Ref.set(
          keys,
          rows.map((row) => (row.id === keyId ? next : row)),
        );
        return next;
      });

    return handlers
      .handle("list", () => Ref.get(keys))
      .handle("mint", ({ payload }) =>
        Effect.gen(function* () {
          const id = newId("key") as ApiKeyId;
          const plaintext = `capy_sample_${id}`;
          const key = new ApiKey({
            id,
            name: payload.name,
            tokenHint: tokenHintFor(plaintext),
            principalKind:
              payload.serviceUserId === undefined ? "human" : "service",
            principalUserId: payload.serviceUserId ?? UserId.make(viewer.id),
            expiresAt: payload.expiresAt ?? null,
            revokedAt: null,
            createdByUserId: UserId.make(viewer.id),
            createdAt: fixtureNow,
            privateProjects: [],
          });
          yield* Ref.update(keys, (rows) => [...rows, key]);
          return new MintedApiKey({ key, plaintext });
        }),
      )
      .handle("rename", ({ params, payload }) =>
        update(params.keyId, (key) => new ApiKey({ ...key, name: payload.name })),
      )
      .handle("revoke", ({ params }) =>
        update(params.keyId, (key) =>
          key.revokedAt === null
            ? new ApiKey({ ...key, revokedAt: DateTime.nowUnsafe() })
            : key,
        ),
      );
  }),
);
