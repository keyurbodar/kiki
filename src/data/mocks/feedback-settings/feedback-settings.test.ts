import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

const key = `feedback-settings:${orgId}`;
const settingsAtom = ApiClient.query("feedback-settings", "feedbackSettings", {
  params: { orgId },
  reactivityKeys: [key],
});
const configure = ApiClient.mutation("feedback-settings", "configureFeedback");

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

describe("feedback-settings mock", () => {
  it.effect("returns feedback settings", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const settings = (yield* Registry.getResult(registry, settingsAtom)) as {
        enabled: boolean;
        projectId: string;
      };
      assert.isTrue(settings.enabled);
      assert.equal(settings.projectId, projects.web.id);
    }),
  );

  it.effect("refreshes settings after configureFeedback", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(settingsAtom);
      yield* Registry.getResult(registry, settingsAtom);

      yield* run(registry, configure, {
        params: { orgId },
        payload: {
          enabled: false,
          prompt: "How was the release notes flow?",
          weeklyDigest: true,
        },
      });
      const settings = (yield* Registry.getResult(registry, settingsAtom, {
        suspendOnWaiting: true,
      })) as { enabled: boolean; prompt: string; weeklyDigest: boolean };
      assert.isFalse(settings.enabled);
      assert.equal(settings.prompt, "How was the release notes flow?");
      assert.isTrue(settings.weeklyDigest);
    }),
  );
});
