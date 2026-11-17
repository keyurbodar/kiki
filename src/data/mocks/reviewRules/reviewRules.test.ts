import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Rule {
  readonly id: string;
  readonly body: string;
  readonly scopes: ReadonlyArray<string>;
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
        payload: { body: "Keep examples short", scopes: ["*"] },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(registry, create)) as {
        rule: Rule;
      };
      assert.isString(created.rule.id);
      assert.equal(created.rule.status, "active");

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
});
