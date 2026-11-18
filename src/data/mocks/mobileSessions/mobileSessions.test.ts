import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

const key = `mobileSessions:${orgId}`;
const listAtom = ApiClient.query("mobileSessions", "list", {
  params: { orgId, jamId: threads.checkoutTest.id },
  reactivityKeys: [key],
});

interface Session {
  readonly id: string;
  readonly jamId: string;
  readonly status: "active" | "stopped";
  readonly stoppedAt: string | null;
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

describe("mobileSessions mock", () => {
  it.effect("lists and gets sessions, then stops one", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(listAtom);
      const rows = (yield* Registry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<Session>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(rows.every((row) => row.jamId === threads.checkoutTest.id));
      const active = rows.find((row) => row.status === "active");
      assert.isDefined(active);

      const detail = (yield* Registry.getResult(
        registry,
        ApiClient.query("mobileSessions", "get", {
          params: { orgId, sessionId: active.id },
        }),
      )) as Session & { device: { id: string } };
      assert.equal(detail.id, active.id);
      assert.equal(detail.device.id.length > 0, true);

      const stopped = (yield* run(
        registry,
        ApiClient.mutation("mobileSessions", "stop"),
        { params: { orgId, sessionId: active.id } },
      )) as Session;
      assert.equal(stopped.status, "stopped");
      assert.isNotNull(stopped.stoppedAt);

      const after = (yield* Registry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<Session>;
      assert.isFalse(
        after.some((row) => row.id === active.id && row.status === "active"),
      );
    }),
  );

  it.effect("answers the 404 the routes declare for an unknown session", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const missing = { orgId, sessionId: "session_nobody" };
      const calls = [
        ApiClient.query("mobileSessions", "get", { params: missing }),
        ApiClient.query("mobileSessions", "stop", { params: missing }),
      ];
      for (const atom of calls) {
        const error = yield* Registry.getResult(registry, atom as never).pipe(
          Effect.flip,
        );
        assert.instanceOf(error, HttpApiError.NotFound);
      }
    }),
  );
});
