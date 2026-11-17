import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface FeedbackSettings {
  readonly humanMode: string;
  readonly botMode: string;
  readonly botAllowlist: ReadonlyArray<string>;
  readonly prDraftDefault: boolean;
}

const key = `feedback-settings:${orgId}`;
const settingsAtom = ApiClient.query("feedback-settings", "feedbackSettings", {
  params: { orgId },
  reactivityKeys: [key],
});
const configure = ApiClient.mutation("feedback-settings", "configureFeedback");

describe("feedback-settings mock", () => {
  it.effect("reads and configures feedback settings", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const initial = (yield* AtomRegistry.getResult(
        registry,
        settingsAtom,
      )) as FeedbackSettings;
      assert.isString(initial.humanMode);
      assert.isString(initial.botMode);
      assert.isAbove(initial.botAllowlist.length, 0);

      registry.set(configure, {
        params: { orgId },
        payload: {
          humanMode: "listen",
          botAllowlist: ["capy-notes-sample"],
          prDraftDefault: false,
        },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        configure,
      )) as FeedbackSettings;
      assert.equal(updated.humanMode, "listen");
      assert.equal(updated.botAllowlist.length, 1);
      assert.isFalse(updated.prDraftDefault);
    }),
  );
});
