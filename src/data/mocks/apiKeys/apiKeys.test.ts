import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people } from "../fixtures/world.ts";

interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly revokedAt: string | null;
  readonly revoked: boolean;
  readonly createdBy: string;
}

const key = `apiKeys:${orgId}`;
const listAtom = ApiClient.query("apiKeys", "list", {
  params: { orgId },
  reactivityKeys: [key],
});

describe("apiKeys mock", () => {
  it.effect("lists the org's keys with their revocation state", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<ApiKey>;
      assert.deepStrictEqual(
        rows.map((row) => row.name),
        ["CI", "Old script"],
      );
      assert.isFalse(rows[0]?.revoked);
      assert.isTrue(rows[1]?.revoked);
    }),
  );

  it.effect("mints, renames and revokes a key, refreshing the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const minted = ApiClient.mutation("apiKeys", "mint");
      registry.set(minted, {
        params: { orgId },
        payload: { name: "Deploy script" },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        minted,
      )) as ApiKey & { token: string };
      assert.strictEqual(created.name, "Deploy script");
      assert.isTrue(created.token.startsWith(created.prefix));

      registry.set(ApiClient.mutation("apiKeys", "rename"), {
        params: { orgId, keyId: "key_sample_ci" },
        payload: { name: "Release deploy" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(
        registry,
        ApiClient.mutation("apiKeys", "rename"),
      );

      registry.set(ApiClient.mutation("apiKeys", "revoke"), {
        params: { orgId, keyId: "key_sample_ci" },
        reactivityKeys: [key],
      });
      const revoked = yield* AtomRegistry.getResult(
        registry,
        ApiClient.mutation("apiKeys", "revoke"),
      );
      assert.strictEqual((revoked as { ok: boolean }).ok, true);
      assert.isTrue((revoked as ApiKey).revoked);

      const after = (yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<ApiKey>;
      assert.strictEqual(
        after.find((row) => row.id === "key_sample_ci")?.name,
        "Release deploy",
      );
      assert.isDefined(after.find((row) => row.createdBy === people.sam.id));
    }),
  );
});
