import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Preferences {
  readonly marketing: boolean;
  readonly notices: Readonly<Record<string, boolean>>;
  readonly programs: Readonly<Record<string, boolean>>;
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

const key = `emailPreferences:${orgId}`;
const getAtom = ApiClient.query("emailPreferences", "get", {
  reactivityKeys: [key],
});
const setMarketing = ApiClient.mutation("emailPreferences", "setMarketing");
const setNotice = ApiClient.mutation("emailPreferences", "setNotice");
const setProgram = ApiClient.mutation("emailPreferences", "setProgram");

describe("emailPreferences mock", () => {
  it.effect("returns non-empty preferences", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const value = (yield* AtomRegistry.getResult(
        registry,
        getAtom,
      )) as Preferences;
      assert.isBoolean(value.marketing);
      assert.isTrue(value.notices["pull-review"]);
      assert.isFalse(value.programs["beta-program"]);
    }),
  );

  it.effect("flips marketing, notice and program flags", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(getAtom);
      yield* AtomRegistry.getResult(registry, getAtom);
      yield* run(registry, setMarketing, { payload: { enabled: false } });
      assert.isFalse(
        (
          (yield* AtomRegistry.getResult(registry, getAtom, {
            suspendOnWaiting: true,
          })) as Preferences
        ).marketing,
      );
      yield* run(registry, setNotice, {
        params: { template: "machine-alert" },
        payload: { enabled: true },
      });
      yield* run(registry, setProgram, {
        params: { program: "beta-program" },
        payload: { enabled: true },
      });
      const after = (yield* AtomRegistry.getResult(registry, getAtom, {
        suspendOnWaiting: true,
      })) as Preferences;
      assert.isTrue(after.notices["machine-alert"]);
      assert.isTrue(after.programs["beta-program"]);
    }),
  );
});
