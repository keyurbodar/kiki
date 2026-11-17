import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, repos } from "../fixtures/world.ts";

const key = `reviewRules:${orgId}`;
const listAtom = ApiClient.query("reviewRules", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const getAtom = (id: string) =>
  ApiClient.query("reviewRules", "get", { params: { orgId, id } });
const create = ApiClient.mutation("reviewRules", "create");
const update = ApiClient.mutation("reviewRules", "update");
const remove = ApiClient.mutation("reviewRules", "remove");

interface Rule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly repoNames: ReadonlyArray<string>;
}

const names = (value: unknown) =>
  (value as ReadonlyArray<Rule>).map((row) => row.name);

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

describe("reviewRules mock", () => {
  it.effect("lists, filters and gets rules", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const rows = (yield* Registry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<Rule>;
      assert.isAbove(rows.length, 0);
      assert.include(rows[0]!.repoNames, repos[0].fullName);

      const detail = (yield* Registry.getResult(
        registry,
        getAtom(rows[0]!.id),
      )) as Rule & { createdByUser: { id: string } };
      assert.equal(detail.id, rows[0]!.id);
      assert.isTrue(detail.createdByUser.id.length > 0);

      const filtered = ApiClient.query("reviewRules", "list", {
        params: { orgId },
        query: { search: "nonexistent rule" },
      });
      assert.isEmpty(yield* Registry.getResult(registry, filtered));
    }),
  );

  it.effect("refreshes the list after create, update and remove", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(listAtom);
      yield* Registry.getResult(registry, listAtom);

      const created = (yield* run(registry, create, {
        params: { orgId },
        payload: { name: "Security review", repoIds: [repos[1].id] },
      })) as Rule;
      assert.include(
        names(
          yield* Registry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Security review",
      );

      yield* run(registry, update, {
        params: { orgId, id: created.id },
        payload: { name: "Security checks", enabled: false },
      });
      const updatedList = (yield* Registry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<Rule>;
      assert.include(names(updatedList), "Security checks");
      assert.isFalse(updatedList.find((row) => row.id === created.id)?.enabled);

      yield* run(registry, remove, { params: { orgId, id: created.id } });
      assert.notInclude(
        names(
          yield* Registry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Security checks",
      );
    }),
  );
});
