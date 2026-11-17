import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";
import { sampleReviewSettings } from "./fixtures.ts";

interface ReviewSetting {
  readonly repo: string;
  readonly autoReview: boolean;
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
      assert.isBoolean(settings[0]!.autoReview);
      const policy = (yield* AtomRegistry.getResult(
        registry,
        policyAtom,
      )) as SelfPolicy;
      assert.isString(policy.selfLogin);
      assert.isFalse(policy.selfReviewed);
    }),
  );

  it.effect("updates configuration and self-author policy", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const repo = sampleReviewSettings[1]!.repo;
      registry.set(configure, {
        params: { orgId },
        payload: { repo, autoReview: true, postStatusCheck: false },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        configure,
      )) as ReviewSetting;
      assert.equal(updated.repo, repo);
      assert.isTrue(updated.autoReview);
      assert.isFalse(updated.postStatusCheck);

      registry.set(setPolicy, {
        params: { orgId },
        payload: { reviewed: true },
        reactivityKeys: [key],
      });
      const policy = (yield* AtomRegistry.getResult(
        registry,
        setPolicy,
      )) as SelfPolicy;
      assert.isTrue(policy.selfReviewed);
    }),
  );
});
