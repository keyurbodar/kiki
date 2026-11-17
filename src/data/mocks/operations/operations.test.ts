import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

interface Operation {
  readonly id: string;
  readonly status: string;
}

const key = `operations:${orgId}`;
const jamId = threads.checkoutTest.id;

const listAtom = ApiClient.query("operations", "list", {
  params: { orgId, jamId },
  reactivityKeys: [key],
});
const cancelMutation = ApiClient.mutation("operations", "cancelSubscription");

describe("operations mock", () => {
  it.effect("lists operations and cancels a subscription", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      const operations = yield* AtomRegistry.getResult(registry, listAtom);
      assert.isAtLeast((operations as ReadonlyArray<Operation>).length, 1);
      const subscription = (operations as ReadonlyArray<Operation>).find(
        (operation) => operation.id === "op_sample_run3",
      );
      assert.isDefined(subscription);

      registry.set(cancelMutation, {
        params: { orgId, jamId, operationId: "op_sample_run3" },
        reactivityKeys: [key],
      });
      const result = yield* AtomRegistry.getResult(registry, cancelMutation);
      assert.strictEqual((result as { ok: boolean }).ok, true);

      const refetched = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual(
        (refetched as ReadonlyArray<Operation>).find(
          (operation) => operation.id === "op_sample_run3",
        )?.status,
        "canceled",
      );
    }),
  );
});
