import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly revokedAt: string | null;
}

const key = `apiKeys:${orgId}`;
const listAtom = ApiClient.query("apiKeys", "list", {
  params: { orgId },
  reactivityKeys: [key],
});
const mint = ApiClient.mutation("apiKeys", "mint");
const rename = ApiClient.mutation("apiKeys", "rename");
const revoke = ApiClient.mutation("apiKeys", "revoke");

const rows = (value: unknown) => value as ReadonlyArray<ApiKey>;

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  mutation: unknown,
  input: object,
) => {
  const writable = mutation as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

describe("apiKeys mock", () => {
  it.effect("answers every apiKeys endpoint and refreshes the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom as never);
      assert.isAbove(
        rows(yield* AtomRegistry.getResult(registry, listAtom)).length,
        0,
      );

      const created = (yield* run(registry, mint, {
        params: { orgId },
        payload: { name: "Sample automation" },
      })) as ApiKey;
      assert.isNotEmpty(created.prefix);
      assert.isNull(created.revokedAt);
      assert.include(
        rows(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        created.id,
      );

      yield* run(registry, rename, {
        params: { orgId, keyId: created.id },
        payload: { name: "Renamed automation" },
      });
      assert.strictEqual(
        rows(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).find((row) => row.id === created.id)?.name,
        "Renamed automation",
      );

      const revoked = (yield* run(registry, revoke, {
        params: { orgId, keyId: created.id },
      })) as { ok: boolean; id: string; revokedAt: string };
      assert.isTrue(revoked.ok);
      assert.strictEqual(revoked.id, created.id);
      assert.isNotEmpty(revoked.revokedAt);
      assert.isNotNull(
        rows(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).find((row) => row.id === created.id)?.revokedAt,
      );
    }),
  );
});
