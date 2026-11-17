import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const key = `issue-states:${orgId}`;
const statesQuery = ApiClient.query("issues", "states", {
  params: { orgId },
  reactivityKeys: [key],
});
const deleteState = ApiClient.mutation("issue-states", "deleteState");
const setDefaultState = ApiClient.mutation("issue-states", "setDefaultState");

type State = {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
};

const names = (value: unknown) =>
  (value as ReadonlyArray<State>).map((state) => state.name);

describe("issue-states mock", () => {
  it.effect("both endpoints change the shared state list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(statesQuery);
      const initial = yield* AtomRegistry.getResult(registry, statesQuery);
      assert.include(names(initial), "Backlog");

      registry.set(deleteState, {
        params: { orgId, stateId: "ist_sample_canceled" },
        query: {},
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteState);
      const afterDelete = yield* AtomRegistry.getResult(registry, statesQuery, {
        suspendOnWaiting: true,
      });
      assert.notInclude(names(afterDelete), "Canceled");

      registry.set(setDefaultState, {
        params: { orgId, stateId: "ist_sample_in_progress" },
        reactivityKeys: [key],
      });
      const defaultState = yield* AtomRegistry.getResult(
        registry,
        setDefaultState,
      );
      assert.equal((defaultState as State).id, "ist_sample_in_progress");
      assert.isTrue((defaultState as State).isDefault);
      const afterDefault = yield* AtomRegistry.getResult(
        registry,
        statesQuery,
        {
          suspendOnWaiting: true,
        },
      );
      assert.isTrue(
        (afterDefault as ReadonlyArray<State>).find(
          (state) => state.id === "ist_sample_in_progress",
        )?.isDefault,
      );
    }),
  );
});
