import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { devices, orgId, people, viewer } from "../fixtures/world.ts";

interface Subscription {
  readonly id: string;
  readonly deviceId: string;
  readonly ownerId: string;
  readonly enabled: boolean;
}
interface PushState {
  readonly enabled: boolean;
  readonly subscriptions: ReadonlyArray<Subscription>;
}

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

const key = `push:${orgId}`;
const getAtom = ApiClient.query("push", "get", { reactivityKeys: [key] });
const subscribe = ApiClient.mutation("push", "subscribe");
const patch = ApiClient.mutation("push", "patch");
const unsubscribe = ApiClient.mutation("push", "unsubscribe");
const test = ApiClient.mutation("push", "test");

describe("push mock", () => {
  it.effect("returns push settings and subscriptions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const state = (yield* AtomRegistry.getResult(
        registry,
        getAtom,
      )) as PushState;
      assert.isTrue(state.enabled);
      assert.include(
        state.subscriptions.map((row) => row.deviceId),
        devices[0].id,
      );
    }),
  );

  it.effect("lists only the signed-in user's subscriptions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const state = (yield* AtomRegistry.getResult(
        registry,
        getAtom,
      )) as PushState;
      assert.isAbove(state.subscriptions.length, 0);
      assert.isTrue(
        state.subscriptions.every((row) => row.ownerId === viewer.id),
      );
      assert.notInclude(
        state.subscriptions.map((row) => row.ownerId),
        people.sam.id,
      );
    }),
  );

  it.effect("subscribes, patches, tests and unsubscribes", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(getAtom);
      yield* AtomRegistry.getResult(registry, getAtom);
      const state = () =>
        AtomRegistry.getResult(registry, getAtom, {
          suspendOnWaiting: true,
        }) as Effect.Effect<PushState>;

      const created = (yield* run(registry, subscribe, {
        payload: { deviceId: devices[1].id, enabled: true },
      })) as Subscription;
      assert.include(
        (yield* state()).subscriptions.map((row) => row.id),
        created.id,
      );

      yield* run(registry, patch, {
        params: { id: created.id },
        payload: { enabled: false },
      });
      assert.isFalse(
        (yield* state()).subscriptions.find((row) => row.id === created.id)
          ?.enabled,
      );

      const result = (yield* run(registry, test, {
        params: { id: created.id },
      })) as {
        ok: boolean;
      };
      assert.isTrue(result.ok);

      yield* run(registry, unsubscribe, { params: { id: created.id } });
      assert.notInclude(
        (yield* state()).subscriptions.map((row) => row.id),
        created.id,
      );
    }),
  );

  it.effect(
    "answers the 404 the routes declare for an unknown subscription",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const calls = [patch, unsubscribe, test];
        for (const atom of calls) {
          const error = yield* run(registry, atom, {
            params: { id: "push_sub_nobody" },
            payload: { enabled: false },
          }).pipe(Effect.flip);
          assert.instanceOf(error, HttpApiError.NotFound);
        }
      }),
  );
});
