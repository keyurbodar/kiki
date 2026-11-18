import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Row {
  readonly id: string;
  readonly repo: string;
  readonly patterns?: ReadonlyArray<string>;
  readonly conditions?: ReadonlyArray<{ readonly field: string }>;
}

const key = `reviewFilters:${orgId}`;
const rulesAtom = ApiClient.query("reviewFilters", "listRules", {
  params: { orgId },
  reactivityKeys: [key],
});
const pathsAtom = ApiClient.query("reviewFilters", "listIgnorePaths", {
  params: { orgId },
  reactivityKeys: [key],
});
const createRule = ApiClient.mutation("reviewFilters", "createRule");
const updateRule = ApiClient.mutation("reviewFilters", "updateRule");
const deleteRule = ApiClient.mutation("reviewFilters", "deleteRule");
const createPaths = ApiClient.mutation("reviewFilters", "createIgnorePaths");
const updatePaths = ApiClient.mutation("reviewFilters", "updateIgnorePaths");
const deletePaths = ApiClient.mutation("reviewFilters", "deleteIgnorePaths");

describe("reviewFilters mock", () => {
  it.effect("serves rules and ignore paths", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rules = (yield* AtomRegistry.getResult(registry, rulesAtom)) as {
        rules: ReadonlyArray<Row>;
        repositories: ReadonlyArray<unknown>;
      };
      assert.isAbove(rules.rules.length, 0);
      assert.isAbove(rules.repositories.length, 0);
      const paths = (yield* AtomRegistry.getResult(registry, pathsAtom)) as {
        ignorePaths: ReadonlyArray<Row>;
      };
      assert.isAbove(paths.ignorePaths.length, 0);
      assert.isAbove(paths.ignorePaths[0]!.patterns!.length, 0);
    }),
  );

  it.effect("applies rule and ignore-path mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(createRule, {
        params: { orgId },
        payload: {
          repo: "acme/web",
          conditions: [{ field: "label", not: false, values: ["skip-review"] }],
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        createRule,
      )) as Row;
      assert.isString(created.id);
      assert.equal(created.conditions![0]!.field, "label");

      registry.set(updateRule, {
        params: { orgId, id: created.id },
        payload: { conditions: [] },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        updateRule,
      )) as Row;
      assert.equal(updated.conditions!.length, 0);

      registry.set(createPaths, {
        params: { orgId },
        payload: { repo: "acme/web", patterns: ["dist/**"] },
        reactivityKeys: [key],
      });
      const createdPaths = (yield* AtomRegistry.getResult(
        registry,
        createPaths,
      )) as Row;
      assert.include(createdPaths.patterns!, "dist/**");

      registry.set(updatePaths, {
        params: { orgId, id: createdPaths.id },
        payload: { patterns: ["build/**"] },
        reactivityKeys: [key],
      });
      const updatedPaths = (yield* AtomRegistry.getResult(
        registry,
        updatePaths,
      )) as Row;
      assert.include(updatedPaths.patterns!, "build/**");

      registry.set(deleteRule, {
        params: { orgId, id: created.id },
        reactivityKeys: [key],
      });
      registry.set(deletePaths, {
        params: { orgId, id: createdPaths.id },
        reactivityKeys: [key],
      });
      const deleted = (yield* AtomRegistry.getResult(registry, deleteRule)) as {
        deleted: boolean;
      };
      assert.isTrue(deleted.deleted);
      const deletedPaths = (yield* AtomRegistry.getResult(
        registry,
        deletePaths,
      )) as { deleted: boolean };
      assert.isTrue(deletedPaths.deleted);
    }),
  );

  it.effect("saves all-repository scopes and numeric repository IDs", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(createRule, {
        params: { orgId },
        payload: {
          repo: null,
          conditions: [],
          repositoryCondition: { not: false, repoIds: [1002, 1003] },
        },
        reactivityKeys: [key],
      });
      const rule = (yield* AtomRegistry.getResult(registry, createRule)) as {
        id: string;
        repo: string | null;
        repositoryCondition: { repoIds: ReadonlyArray<number> };
      };
      assert.isNull(rule.repo);
      assert.deepEqual(rule.repositoryCondition.repoIds, [1002, 1003]);

      registry.set(updateRule, {
        params: { orgId, id: rule.id },
        payload: { repo: null },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(registry, updateRule)) as {
        repo: string | null;
        repositoryCondition: { repoIds: ReadonlyArray<number> };
      };
      assert.isNull(updated.repo);
      assert.deepEqual(updated.repositoryCondition.repoIds, [1002, 1003]);

      registry.set(createPaths, {
        params: { orgId },
        payload: { repo: null, patterns: ["dist/**"] },
        reactivityKeys: [key],
      });
      const paths = (yield* AtomRegistry.getResult(registry, createPaths)) as {
        id: string;
        repo: string | null;
      };
      assert.isNull(paths.repo);

      registry.set(deleteRule, {
        params: { orgId, id: rule.id },
        reactivityKeys: [key],
      });
      registry.set(deletePaths, {
        params: { orgId, id: paths.id },
        reactivityKeys: [key],
      });
    }),
  );

  it.effect(
    "answers an unknown rule or ignore-path with the declared 400",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const missing = "rfilt_unknown";

        registry.set(updateRule, {
          params: { orgId, id: missing },
          payload: { repo: "acme/web" },
          reactivityKeys: [key],
        });
        const updateRuleMiss = yield* AtomRegistry.getResult(
          registry,
          updateRule,
        ).pipe(Effect.flip);
        assert.instanceOf(updateRuleMiss, InvalidRequest);

        registry.set(deleteRule, {
          params: { orgId, id: missing },
          reactivityKeys: [key],
        });
        const deleteRuleMiss = yield* AtomRegistry.getResult(
          registry,
          deleteRule,
        ).pipe(Effect.flip);
        assert.instanceOf(deleteRuleMiss, InvalidRequest);

        registry.set(updatePaths, {
          params: { orgId, id: missing },
          payload: { patterns: ["dist/**"] },
          reactivityKeys: [key],
        });
        const updatePathsMiss = yield* AtomRegistry.getResult(
          registry,
          updatePaths,
        ).pipe(Effect.flip);
        assert.instanceOf(updatePathsMiss, InvalidRequest);

        registry.set(deletePaths, {
          params: { orgId, id: missing },
          reactivityKeys: [key],
        });
        const deletePathsMiss = yield* AtomRegistry.getResult(
          registry,
          deletePaths,
        ).pipe(Effect.flip);
        assert.instanceOf(deletePathsMiss, InvalidRequest);
      }),
  );
});
