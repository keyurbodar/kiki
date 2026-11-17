import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const key = `restore:${orgId}`;
const restoreMutation = ApiClient.mutation("restore", "restore");

describe("restore mock", () => {
  it.effect("restores the snapshot items", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(restoreMutation, {
        params: { orgId },
        reactivityKeys: [key],
      });
      const result = yield* AtomRegistry.getResult(registry, restoreMutation);
      assert.strictEqual((result as { status: string }).status, "restored");
      assert.isAtLeast((result as { restoredCount: number }).restoredCount, 1);
      const restored = yield* AtomRegistry.getResult(
        registry,
        restoreMutation,
        {
          suspendOnWaiting: true,
        },
      );
      assert.strictEqual((restored as { status: string }).status, "restored");
    }),
  );
});
