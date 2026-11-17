import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, repos } from "../fixtures/world.ts";

const key = `reviewFilters:${orgId}`;
const ignoreAtom = ApiClient.query("reviewFilters", "listIgnorePaths", {
  params: { orgId },
  reactivityKeys: [key],
});
const rulesAtom = ApiClient.query("reviewFilters", "listRules", {
  params: { orgId },
  reactivityKeys: [key],
});

interface IgnorePath {
  readonly id: string;
  readonly pattern: string;
  readonly repoNames: ReadonlyArray<string>;
}
interface FilterRule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

const patterns = (value: unknown) =>
  (value as ReadonlyArray<IgnorePath>).map((row) => row.pattern);
const names = (value: unknown) =>
  (value as ReadonlyArray<FilterRule>).map((row) => row.name);
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

describe("reviewFilters mock", () => {
  it.effect("lists both kinds of filters", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const ignores = (yield* Registry.getResult(
        registry,
        ignoreAtom,
      )) as ReadonlyArray<IgnorePath>;
      const rules = (yield* Registry.getResult(
        registry,
        rulesAtom,
      )) as ReadonlyArray<FilterRule>;
      assert.isAbove(ignores.length, 0);
      assert.include(ignores[0]!.repoNames, repos[0].fullName);
      assert.isAbove(rules.length, 0);
    }),
  );

  it.effect("refreshes ignore paths and rules after mutations", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(ignoreAtom);
      registry.mount(rulesAtom);
      yield* Registry.getResult(registry, ignoreAtom);
      yield* Registry.getResult(registry, rulesAtom);

      const createdPath = (yield* run(
        registry,
        ApiClient.mutation("reviewFilters", "createIgnorePaths"),
        {
          params: { orgId },
          payload: { patterns: ["build/cache/**"], repoIds: [repos[0].id] },
        },
      )) as ReadonlyArray<IgnorePath>;
      assert.include(
        patterns(
          yield* Registry.getResult(registry, ignoreAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "build/cache/**",
      );

      yield* run(
        registry,
        ApiClient.mutation("reviewFilters", "updateIgnorePaths"),
        {
          params: { orgId, id: createdPath[0]!.id },
          payload: { pattern: "dist/cache/**", enabled: false },
        },
      );
      const updatedPaths = (yield* Registry.getResult(registry, ignoreAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<IgnorePath>;
      assert.include(patterns(updatedPaths), "dist/cache/**");
      assert.notInclude(patterns(updatedPaths), "build/cache/**");

      yield* run(
        registry,
        ApiClient.mutation("reviewFilters", "deleteIgnorePaths"),
        {
          params: { orgId, id: createdPath[0]!.id },
        },
      );
      assert.notInclude(
        patterns(
          yield* Registry.getResult(registry, ignoreAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "dist/cache/**",
      );

      const createdRule = (yield* run(
        registry,
        ApiClient.mutation("reviewFilters", "createRule"),
        {
          params: { orgId },
          payload: { name: "Flag debug logs", value: "console.log" },
        },
      )) as FilterRule;
      assert.include(
        names(
          yield* Registry.getResult(registry, rulesAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Flag debug logs",
      );

      yield* run(registry, ApiClient.mutation("reviewFilters", "updateRule"), {
        params: { orgId, id: createdRule.id },
        payload: { name: "Flag console logs" },
      });
      assert.include(
        names(
          yield* Registry.getResult(registry, rulesAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Flag console logs",
      );

      yield* run(registry, ApiClient.mutation("reviewFilters", "deleteRule"), {
        params: { orgId, id: createdRule.id },
      });
      assert.notInclude(
        names(
          yield* Registry.getResult(registry, rulesAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Flag console logs",
      );
    }),
  );
});
