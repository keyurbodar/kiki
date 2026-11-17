import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const key = `emailPreferences:${orgId}`;
const getAtom = ApiClient.query("emailPreferences", "get", {
  reactivityKeys: [key],
});
const setMarketing = ApiClient.mutation("emailPreferences", "setMarketing");
const setNotice = ApiClient.mutation("emailPreferences", "setNotice");
const setProgram = ApiClient.mutation("emailPreferences", "setProgram");

describe("emailPreferences mock", () => {
  it.effect("returns Capy's EmailPreferencesState", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const value = yield* AtomRegistry.getResult(registry, getAtom);
      assert.isBoolean(value.marketing);
      assert.isFalse(value.blocked);
      assert.isTrue(value.noticesEditable);
      assert.deepStrictEqual(
        value.programs.map((row) => row.program),
        ["product_news", "weekly", "onboarding", "win_back"],
      );
      assert.isFalse(
        value.programs.find((row) => row.program === "win_back")?.subscribed,
      );
      assert.isTrue(
        value.notices.find((row) => row.template === "org_invite")?.subscribed,
      );
    }),
  );

  it.effect("flips marketing, notice and program subscriptions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(getAtom);
      yield* AtomRegistry.getResult(registry, getAtom);

      registry.set(setMarketing, {
        payload: { subscribed: false },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, setMarketing);
      registry.set(setNotice, {
        params: { template: "auto_reload" },
        payload: { subscribed: true },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, setNotice);
      registry.set(setProgram, {
        params: { program: "win_back" },
        payload: { subscribed: true },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, setProgram);

      const after = yield* AtomRegistry.getResult(registry, getAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse(after.marketing);
      assert.isTrue(
        after.notices.find((row) => row.template === "auto_reload")?.subscribed,
      );
      assert.isTrue(
        after.programs.find((row) => row.program === "win_back")?.subscribed,
      );
      assert.strictEqual(after.programs.length, 4);
    }),
  );
});
