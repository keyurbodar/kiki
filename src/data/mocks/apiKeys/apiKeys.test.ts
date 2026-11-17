import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { ApiKey, MintedApiKey } from "../../api/schemas/api-keys.ts";
import { OrgId, ServiceUserId } from "../../api/schemas/ids.ts";
import {
  apiKeysAtom,
  apiSettingsKeys,
  mintApiKey,
  renameApiKey,
  revokeApiKey,
} from "../../atoms/api-keys.ts";
import { orgId as worldOrgId } from "../fixtures/world.ts";

const orgId = OrgId.make(worldOrgId);
const reactivityKeys = apiSettingsKeys.apiSettings(orgId);
const names = (keys: ReadonlyArray<ApiKey>) => keys.map((key) => key.name);

describe("apiKeys mock", () => {
  it.effect("lists the world's keys plus the service-user samples", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const keys = yield* AtomRegistry.getResult(registry, apiKeysAtom(orgId));
      assert.deepStrictEqual(names(keys), [
        "CI",
        "Old script",
        "Deploy workflow",
        "Local scripts",
      ]);
      assert.isNotNull(
        keys.find((key) => key.name === "Old script")?.revokedAt,
      );
    }),
  );

  it.effect("mints, renames and revokes, refetching the list each time", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = apiKeysAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(mintApiKey, {
        params: { orgId },
        payload: {
          name: "Nightly",
          serviceUserId: ServiceUserId.make("svc_sample_release"),
        },
        reactivityKeys,
      });
      const minted = (yield* AtomRegistry.getResult(
        registry,
        mintApiKey,
      )) as MintedApiKey;
      assert.strictEqual(minted.key.principalKind, "service");
      assert.isTrue(minted.plaintext.startsWith("capy_"));
      const afterMint = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterMint), "Nightly");

      registry.set(renameApiKey, {
        params: { orgId, keyId: minted.key.id },
        payload: { name: "Nightly sync" },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, renameApiKey);
      registry.set(revokeApiKey, {
        params: { orgId, keyId: minted.key.id },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, revokeApiKey);
      const afterRevoke = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      const revoked = afterRevoke.find((key) => key.id === minted.key.id);
      assert.strictEqual(revoked?.name, "Nightly sync");
      assert.isNotNull(revoked?.revokedAt);
    }),
  );
});
