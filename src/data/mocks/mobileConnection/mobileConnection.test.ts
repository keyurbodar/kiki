import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { devices, orgId } from "../fixtures/world.ts";

const key = `mobileConnection:${orgId}`;
const connectionAtom = ApiClient.query("mobileConnection", "get", {
  params: { orgId },
  reactivityKeys: [key],
});

interface Connection {
  readonly connected: boolean;
  readonly enabled: boolean;
  readonly deviceId: string;
  readonly device: { readonly id: string; readonly online: boolean } | null;
}

const run = (
  registry: AtomRegistry.AtomRegistry,
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return Registry.getResult(registry, writable as never) as Effect.Effect<
    unknown,
    never,
    never
  >;
};

describe("mobileConnection mock", () => {
  it.effect("connects, disconnects and toggles mobile access", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(connectionAtom);
      const read = () =>
        Registry.getResult(registry, connectionAtom, {
          suspendOnWaiting: true,
        }) as Effect.Effect<Connection>;
      const initial = yield* read();
      assert.isTrue(initial.connected);
      assert.equal(initial.deviceId, devices[0].id);

      yield* run(
        registry,
        ApiClient.mutation("mobileConnection", "disconnect"),
        {
          params: { orgId },
        },
      );
      assert.isFalse((yield* read()).connected);

      const connected = (yield* run(
        registry,
        ApiClient.mutation("mobileConnection", "connect"),
        { params: { orgId } },
      )) as Connection;
      assert.isTrue(connected.connected);
      assert.equal(connected.device?.id, connected.deviceId);
      assert.isFalse((yield* read()).connected === false);

      yield* run(
        registry,
        ApiClient.mutation("mobileConnection", "setEnabled"),
        { params: { orgId }, payload: { enabled: false } },
      );
      assert.isFalse((yield* read()).enabled);

      const dashboard = (yield* run(
        registry,
        ApiClient.mutation("mobileConnection", "dashboard"),
        { params: { orgId } },
      )) as { activeSessions: number; connected: boolean };
      assert.isAbove(dashboard.activeSessions, 0);
      assert.isTrue(dashboard.connected);
    }),
  );
});
