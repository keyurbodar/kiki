import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Wallpaper {
  readonly id: string;
  readonly name: string;
  readonly isBackground: boolean;
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

const key = `wallpapers:${orgId}`;
const listAtom = ApiClient.query("wallpapers", "list", {
  reactivityKeys: [key],
});
const upload = ApiClient.mutation("wallpapers", "upload");
const remove = ApiClient.mutation("wallpapers", "remove");
const background = ApiClient.mutation("wallpapers", "background");

const names = (value: unknown) =>
  (value as ReadonlyArray<Wallpaper>).map((wallpaper) => wallpaper.name);

describe("wallpapers mock", () => {
  it.effect("lists wallpapers and serves an image", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<Wallpaper>;
      assert.include(names(list), "Dunes");
      const image = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("wallpapers", "image", {
          params: { wallpaperId: "wp_sample_harbor" },
          reactivityKeys: [key],
        }),
      );
      assert.ok((image as { url: string }).url.includes("example.com"));
    }),
  );

  it.effect("uploads, sets as background and removes a wallpaper", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      const created = (yield* run(registry, upload, {
        payload: { name: "Canyon" },
      })) as Wallpaper;
      assert.include(
        names(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Canyon",
      );

      yield* run(registry, background, { params: { wallpaperId: created.id } });
      const afterBackground = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
        {
          suspendOnWaiting: true,
        },
      )) as ReadonlyArray<Wallpaper>;
      assert.isTrue(
        afterBackground.find((wallpaper) => wallpaper.id === created.id)
          ?.isBackground,
      );
      assert.isFalse(
        afterBackground.find((wallpaper) => wallpaper.id === "wp_sample_dunes")
          ?.isBackground,
      );

      yield* run(registry, remove, { params: { wallpaperId: created.id } });
      assert.notInclude(
        names(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ),
        "Canyon",
      );
    }),
  );

  it.effect("answers the 404 the routes declare for an unknown wallpaper", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const params = { wallpaperId: "wp_nobody" };
      const mutations = [
        ApiClient.mutation("wallpapers", "remove"),
        ApiClient.mutation("wallpapers", "background"),
      ];
      for (const atom of mutations) {
        const error = yield* run(registry, atom, { params }).pipe(Effect.flip);
        assert.instanceOf(error, HttpApiError.NotFound);
      }
      const image = ApiClient.query("wallpapers", "image", { params });
      const error = yield* AtomRegistry.getResult(
        registry,
        image as never,
      ).pipe(Effect.flip);
      assert.instanceOf(error, HttpApiError.NotFound);
    }),
  );
});
