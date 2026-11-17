import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Defaults {
  readonly tier: string | null;
  readonly incrementalTier: string | null;
  readonly effectiveTier: string | null;
}

const key = `reviewDefaultSettings:${orgId}`;
const getAtom = ApiClient.query("reviewDefaultSettings", "getOrg", {
  params: { orgId },
  reactivityKeys: [key],
});
const setOrg = ApiClient.mutation("reviewDefaultSettings", "setOrg");

describe("reviewDefaultSettings mock", () => {
  it.effect("reads and updates org review defaults", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const initial = (yield* AtomRegistry.getResult(
        registry,
        getAtom,
      )) as Defaults;
      assert.isNull(initial.tier);
      assert.equal(initial.incrementalTier, "flex");
      assert.isString(initial.effectiveTier);

      registry.set(setOrg, {
        params: { orgId },
        payload: { tier: "high", incrementalTier: "low" },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        setOrg,
      )) as Defaults;
      assert.equal(updated.tier, "high");
      assert.equal(updated.effectiveTier, "high");
      assert.equal(updated.incrementalTier, "low");
    }),
  );
});
