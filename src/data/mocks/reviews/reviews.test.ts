import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";
import { sampleReviewSettings } from "./fixtures.ts";

interface ReviewSetting {
  readonly repo: string;
  readonly autoReview: string;
  readonly heldByCaller: boolean;
  readonly postStatusCheck: boolean;
}

interface SelfPolicy {
  readonly selfLogin: string;
  readonly selfReviewed: boolean;
}

const key = `reviews:${orgId}`;
const settingsAtom = ApiClient.query("reviews", "listSettings", {
  params: { orgId },
  reactivityKeys: [key],
});
const policyAtom = ApiClient.query("reviews", "getSelfAuthorPolicy", {
  params: { orgId },
  reactivityKeys: [key],
});
const configure = ApiClient.mutation("reviews", "configure");
const setPolicy = ApiClient.mutation("reviews", "setSelfAuthorPolicy");

describe("reviews mock", () => {
  it.effect("serves review settings and the self-author policy", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const settings = (yield* AtomRegistry.getResult(
        registry,
        settingsAtom,
      )) as ReadonlyArray<ReviewSetting>;
      assert.isAbove(settings.length, 0);
      assert.equal(settings[0]!.autoReview, "always");
      assert.isTrue(settings[0]!.heldByCaller);
      const policy = (yield* AtomRegistry.getResult(
        registry,
        policyAtom,
      )) as SelfPolicy;
      assert.isString(policy.selfLogin);
      assert.isTrue(policy.selfReviewed);
    }),
  );

  it.effect("updates configuration and self-author policy", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const repo = sampleReviewSettings[1]!.repo;
      registry.set(configure, {
        params: { orgId },
        payload: { repo, autoReview: "once", postStatusCheck: true },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        configure,
      )) as ReviewSetting;
      assert.equal(updated.repo, repo);
      assert.equal(updated.autoReview, "once");
      assert.isTrue(updated.heldByCaller);
      assert.isTrue(updated.postStatusCheck);

      registry.set(setPolicy, {
        params: { orgId },
        payload: { reviewed: false },
        reactivityKeys: [key],
      });
      const policy = (yield* AtomRegistry.getResult(
        registry,
        setPolicy,
      )) as SelfPolicy;
      assert.isFalse(policy.selfReviewed);
    }),
  );
});
