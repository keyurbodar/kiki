import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";

interface Visibility {
  readonly hidden: boolean;
}

const slug = "classic-1pdtkp";
const key = "explore:visibility";

const visibilityAtom = ApiClient.query("explore", "themeVisibility", {
  params: { slug },
  reactivityKeys: [key],
});

const toggle = (hidden: boolean) =>
  Effect.gen(function* () {
    const registry = AtomRegistry.make();
    registry.mount(visibilityAtom);
    yield* AtomRegistry.getResult(registry, visibilityAtom);
    const mutation = ApiClient.mutation("explore", "setThemeVisibility");
    registry.set(mutation, {
      params: { slug },
      payload: { hidden },
      reactivityKeys: [key],
    });
    const result = (yield* AtomRegistry.getResult(registry, mutation)) as {
      hidden: boolean;
    };
    const after = (yield* AtomRegistry.getResult(registry, visibilityAtom, {
      suspendOnWaiting: true,
    })) as Visibility;
    return { result, after };
  });

describe("explore theme visibility mock", () => {
  it.effect("toggles a theme's hidden flag", () =>
    Effect.gen(function* () {
      const hidden = yield* toggle(true);
      assert.isTrue(hidden.result.hidden);
      assert.isTrue(hidden.after.hidden);

      const unhidden = yield* toggle(false);
      assert.isFalse(unhidden.result.hidden);
      assert.isFalse(unhidden.after.hidden);
    }),
  );
});
