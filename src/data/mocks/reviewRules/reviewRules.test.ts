import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Rule {
  readonly id: string;
  readonly body: string;
  readonly scopes: ReadonlyArray<{ readonly repo: string | null }>;
  readonly status: string;
}

const key = `reviewRules:${orgId}`;
const listAtom = ApiClient.query("reviewRules", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const getAtom = (id: string) =>
  ApiClient.query("reviewRules", "get", {
    params: { orgId, id },
    reactivityKeys: [key],
  });
const create = ApiClient.mutation("reviewRules", "create");
const update = ApiClient.mutation("reviewRules", "update");
const remove = ApiClient.mutation("reviewRules", "remove");

describe("reviewRules mock", () => {
  it.effect("lists and reads review rules", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = (yield* AtomRegistry.getResult(registry, listAtom)) as {
        rules: ReadonlyArray<Rule>;
        nextCursor: string | null;
      };
      assert.isAbove(list.rules.length, 0);
      assert.isNull(list.nextCursor);
      const rule = list.rules[0]!;
      const read = (yield* AtomRegistry.getResult(
        registry,
        getAtom(rule.id),
      )) as { rule: Rule };
      assert.equal(read.rule.id, rule.id);
      assert.isString(read.rule.body);
    }),
  );

  it.effect("creates, updates and removes a rule", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(create, {
        params: { orgId },
        payload: {
          body: "Keep examples short",
          scopes: [{ repo: null, paths: [] }],
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(registry, create)) as {
        rule: Rule;
      };
      assert.isString(created.rule.id);
      assert.equal(created.rule.status, "active");
      assert.isNull(created.rule.scopes[0]?.repo);

      registry.set(update, {
        params: { orgId, id: created.rule.id },
        payload: { status: "inactive" },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(registry, update)) as {
        rule: Rule;
        deleted: boolean;
      };
      assert.equal(updated.rule.status, "inactive");
      assert.isFalse(updated.deleted);

      registry.set(remove, {
        params: { orgId, id: created.rule.id },
        reactivityKeys: [key],
      });
      const deleted = (yield* AtomRegistry.getResult(registry, remove)) as {
        deleted: boolean;
      };
      assert.isTrue(deleted.deleted);
    }),
  );

  it.effect("clears a rule body when the editor sends an empty string", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(create, {
        params: { orgId },
        payload: {
          body: "Replace this description",
          scopes: [{ repo: null, paths: [] }],
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(registry, create)) as {
        rule: Rule;
      };
      registry.set(update, {
        params: { orgId, id: created.rule.id },
        payload: { body: "" },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(registry, update)) as {
        rule: Rule;
      };
      assert.equal(updated.rule.body, "");

      const read = (yield* AtomRegistry.getResult(
        registry,
        getAtom(created.rule.id),
      )) as { rule: Rule };
      assert.equal(read.rule.body, "");

      registry.set(remove, {
        params: { orgId, id: created.rule.id },
        reactivityKeys: [key],
      });
    }),
  );

  it.effect("answers an unknown rule with the declared 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const missing = "rrule_unknown";

      const readMiss = yield* AtomRegistry.getResult(
        registry,
        getAtom(missing),
      ).pipe(Effect.flip);
      assert.instanceOf(readMiss, InvalidRequest);

      registry.set(update, {
        params: { orgId, id: missing },
        payload: { status: "inactive" },
        reactivityKeys: [key],
      });
      const updateMiss = yield* AtomRegistry.getResult(registry, update).pipe(
        Effect.flip,
      );
      assert.instanceOf(updateMiss, InvalidRequest);

      registry.set(remove, {
        params: { orgId, id: missing },
        reactivityKeys: [key],
      });
      const removeMiss = yield* AtomRegistry.getResult(registry, remove).pipe(
        Effect.flip,
      );
      assert.instanceOf(removeMiss, InvalidRequest);
    }),
  );

  it.effect("answers a rule with neither a body nor a file with a 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(create, {
        params: { orgId },
        payload: { body: "", scopes: [{ repo: null, paths: [] }] },
        reactivityKeys: [key],
      });
      const error = yield* AtomRegistry.getResult(registry, create).pipe(
        Effect.flip,
      );
      assert.instanceOf(error, InvalidRequest);
    }),
  );
});
