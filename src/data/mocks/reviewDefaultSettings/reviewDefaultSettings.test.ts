import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

const key = `reviewDefaultSettings:${orgId}`;
const defaultsAtom = ApiClient.query("reviewDefaultSettings", "getOrg", {
  params: { orgId },
  reactivityKeys: [key],
});
const setOrg = ApiClient.mutation("reviewDefaultSettings", "setOrg");

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

describe("reviewDefaultSettings mock", () => {
  it.effect("returns the org defaults", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const defaults = (yield* Registry.getResult(registry, defaultsAtom)) as {
        defaultProject: { id: string };
        reviewerCount: number;
      };
      assert.equal(defaults.defaultProject.id, projects.web.id);
      assert.isAbove(defaults.reviewerCount, 0);
    }),
  );

  it.effect("refreshes defaults after setOrg", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(defaultsAtom);
      yield* Registry.getResult(registry, defaultsAtom);

      yield* run(registry, setOrg, {
        params: { orgId },
        payload: {
          reviewerCount: 3,
          defaultProjectId: projects.api.id,
          instruction: "Focus on API compatibility.",
        },
      });
      const defaults = (yield* Registry.getResult(registry, defaultsAtom, {
        suspendOnWaiting: true,
      })) as {
        reviewerCount: number;
        defaultProject: { id: string };
        instruction: string;
      };
      assert.equal(defaults.reviewerCount, 3);
      assert.equal(defaults.defaultProject.id, projects.api.id);
      assert.equal(defaults.instruction, "Focus on API compatibility.");
    }),
  );
});
