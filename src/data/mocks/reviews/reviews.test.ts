import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const key = `reviews:${orgId}`;
const policyAtom = ApiClient.query("reviews", "getSelfAuthorPolicy", {
  params: { orgId },
  reactivityKeys: [key],
});
const settingsAtom = ApiClient.query("reviews", "listSettings", {
  params: { orgId },
  reactivityKeys: [key],
});
const setPolicy = ApiClient.mutation("reviews", "setSelfAuthorPolicy");
const configure = ApiClient.mutation("reviews", "configure");

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

describe("reviews mock", () => {
  it.effect("answers every reviews endpoint", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const policy = (yield* Registry.getResult(registry, policyAtom)) as {
        allowSelfReview: boolean;
      };
      const settings = (yield* Registry.getResult(registry, settingsAtom)) as {
        reviewers: ReadonlyArray<{ id: string }>;
      };
      assert.isFalse(policy.allowSelfReview);
      assert.isAbove(settings.reviewers.length, 0);

      const updated = (yield* run(registry, setPolicy, {
        params: { orgId },
        payload: { allowSelfReview: true },
      })) as { allowSelfReview: boolean };
      assert.isTrue(updated.allowSelfReview);
    }),
  );

  it.effect("refreshes review settings after configure", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(settingsAtom);
      yield* Registry.getResult(registry, settingsAtom);

      yield* run(registry, configure, {
        params: { orgId },
        payload: { reviewerCount: 4, instructions: "Check the retry path." },
      });
      const settings = (yield* Registry.getResult(registry, settingsAtom, {
        suspendOnWaiting: true,
      })) as { reviewerCount: number; instructions: string };
      assert.equal(settings.reviewerCount, 4);
      assert.equal(settings.instructions, "Check the retry path.");
    }),
  );
});
