import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Theme {
  readonly id: string;
  readonly name: string;
  readonly published: boolean;
}
interface Publication {
  readonly id: string;
  readonly themeId: string;
}

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

const key = `themes:${orgId}`;
const listAtom = ApiClient.query("themes", "list", { reactivityKeys: [key] });
const publicationsAtom = ApiClient.query("themes", "publications", {
  reactivityKeys: [key],
});
const create = ApiClient.mutation("themes", "create");
const update = ApiClient.mutation("themes", "update");
const remove = ApiClient.mutation("themes", "remove");
const publish = ApiClient.mutation("themes", "publish");
const unpublish = ApiClient.mutation("themes", "unpublish");

const names = (value: unknown) =>
  (value as ReadonlyArray<Theme>).map((theme) => theme.name);

describe("themes mock", () => {
  it.effect("lists themes and publications", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const [list, publications] = yield* Effect.all([
        AtomRegistry.getResult(registry, listAtom),
        AtomRegistry.getResult(registry, publicationsAtom),
      ]);
      assert.deepEqual(names(list), ["Classic", "Evernight Rain", "Kiki"]);
      assert.lengthOf(publications as ReadonlyArray<Publication>, 0);
    }),
  );

  it.effect("creates, updates, publishes and removes a theme", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(publicationsAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      const created = (yield* run(registry, create, {
        payload: { name: "Harbor" },
      })) as Theme;
      assert.include(
        names(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Harbor",
      );

      yield* run(registry, update, {
        params: { themeId: created.id },
        payload: { name: "Harbor Light" },
      });
      const updated = (yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<Theme>;
      assert.include(
        updated.map((theme) => theme.name),
        "Harbor Light",
      );

      yield* run(registry, publish, {
        params: { themeId: created.id },
        payload: { note: "First release" },
      });
      const published = (yield* AtomRegistry.getResult(
        registry,
        publicationsAtom,
        {
          suspendOnWaiting: true,
        },
      )) as ReadonlyArray<Publication>;
      assert.include(
        published.map((row) => row.themeId),
        created.id,
      );

      yield* run(registry, unpublish, { params: { themeId: created.id } });
      yield* run(registry, remove, { params: { themeId: created.id } });
      const afterRemove = (yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<Theme>;
      assert.notInclude(
        afterRemove.map((theme) => theme.id),
        created.id,
      );
    }),
  );
});
