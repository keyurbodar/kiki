import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";

const slug = "aurora";
const visibilityAtom = ApiClient.query("explore", "themeVisibility", {
  params: { slug },
  reactivityKeys: ["explore:visibility"],
});
const setVisibility = ApiClient.mutation("explore", "setThemeVisibility");
const finalVisibilityAtom = ApiClient.query("explore", "themeVisibility", {
  params: { slug },
  reactivityKeys: ["explore:visibility:final"],
});

describe("explore theme visibility mock", () => {
  it.effect("toggles a theme's hidden flag", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(visibilityAtom);
      const initial = (yield* AtomRegistry.getResult(
        registry,
        visibilityAtom,
      )) as { hidden: boolean };
      assert.isFalse(initial.hidden);

      registry.set(setVisibility, {
        params: { slug },
        payload: { hidden: true },
        reactivityKeys: ["explore:visibility"],
      });
      const hidden = (yield* AtomRegistry.getResult(
        registry,
        setVisibility,
      )) as { hidden: boolean };
      assert.isTrue(hidden.hidden);
      const afterHide = (yield* AtomRegistry.getResult(
        registry,
        visibilityAtom,
        {
          suspendOnWaiting: true,
        },
      )) as { hidden: boolean };
      assert.isTrue(afterHide.hidden);

      registry.set(setVisibility, {
        params: { slug },
        payload: { hidden: false },
        reactivityKeys: ["explore:visibility"],
      });
      yield* AtomRegistry.getResult(registry, setVisibility);
      const afterShow = (yield* AtomRegistry.getResult(
        registry,
        finalVisibilityAtom,
      )) as { hidden: boolean };
      assert.isFalse(afterShow.hidden);
    }),
  );
});
