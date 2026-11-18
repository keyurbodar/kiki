import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, threads } from "../fixtures/world.ts";

interface Handoff {
  readonly id: string;
  readonly status: string;
  readonly toUserId: string;
}

const key = `handoffs:${orgId}`;
const jamId = threads.checkoutTest.id;

const getAtom = ApiClient.query("handoffs", "get", {
  params: { orgId, jamId },
  reactivityKeys: [key],
});
const openMutation = ApiClient.mutation("handoffs", "open");
const cancelMutation = ApiClient.mutation("handoffs", "cancel");

describe("handoffs mock", () => {
  it.effect("gets the handoff and flips it through open and cancel", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(getAtom);
      const initial = yield* AtomRegistry.getResult(registry, getAtom);
      assert.strictEqual((initial as Handoff).status, "open");

      registry.set(openMutation, {
        params: { orgId, jamId: threads.paginate.id },
        payload: { toUserId: people.jordan.id, reason: "Review the cursor." },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, openMutation);
      assert.strictEqual((created as Handoff).status, "open");
      assert.strictEqual((created as Handoff).toUserId, people.jordan.id);

      registry.set(cancelMutation, {
        params: { orgId, jamId, handoffId: (created as Handoff).id },
        reactivityKeys: [key],
      });
      const canceled = yield* AtomRegistry.getResult(registry, cancelMutation);
      assert.strictEqual((canceled as Handoff).status, "canceled");

      const refetched = yield* AtomRegistry.getResult(registry, getAtom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual((refetched as Handoff).status, "open");
    }),
  );

  it.effect(
    "answers the 404 both endpoints declare for an unknown handoff",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const missingGet = ApiClient.query("handoffs", "get", {
          params: { orgId, jamId: threads.darkMode.id },
          reactivityKeys: [key],
        });
        const getError = yield* AtomRegistry.getResult(
          registry,
          missingGet,
        ).pipe(Effect.flip);
        assert.instanceOf(getError, HttpApiError.NotFound);

        registry.set(cancelMutation, {
          params: { orgId, jamId, handoffId: "handoff_nobody" },
        });
        const cancelError = yield* AtomRegistry.getResult(
          registry,
          cancelMutation,
        ).pipe(Effect.flip);
        assert.instanceOf(cancelError, HttpApiError.NotFound);
      }),
  );
});
