import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { type ExploreCard, ExploreListing } from "../../api/schemas/explore.ts";
import { ApiClient } from "../../client/ApiClient.ts";

interface Icon {
  readonly url: string;
  readonly mimeType: string;
}

const iconAtom = ApiClient.query("explorePublic", "icon", {
  params: { kind: "plugin", slug: "edge-platform" },
});
const listingsAtom = ApiClient.query("explorePublic", "listings", {
  query: {},
});
const skillListingsAtom = ApiClient.query("explorePublic", "listings", {
  query: { kind: "skill" },
});
const listingAtom = ApiClient.query("explorePublic", "listing", {
  params: { kind: "skill", slug: "debugging-playbook" },
});
const wallpaperAtom = ApiClient.query("explorePublic", "wallpaperImage", {
  params: { slug: "absolutely" },
  query: {},
});

describe("explorePublic mock", () => {
  it.effect("returns icons for a known listing", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const icon = (yield* AtomRegistry.getResult(registry, iconAtom)) as Icon;
      assert.include(icon.url, "/plugin/edge-platform.png");
      assert.strictEqual(icon.mimeType, "image/png");
    }),
  );

  it.effect("lists public listings as cards", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = (yield* AtomRegistry.getResult(
        registry,
        listingsAtom,
      )) as ReadonlyArray<ExploreCard>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(
        rows.every(
          (row) =>
            row.kind.length > 0 &&
            row.slug.length > 0 &&
            row.displayName.length > 0,
        ),
      );
      assert.isTrue(
        rows.some((row) => row.kind === "plugin") &&
          rows.some((row) => row.kind === "skill"),
      );

      const skills = (yield* AtomRegistry.getResult(
        registry,
        skillListingsAtom,
      )) as ReadonlyArray<ExploreCard>;
      assert.isAbove(skills.length, 0);
      assert.isTrue(skills.every((row) => row.kind === "skill"));
    }),
  );

  it.effect("returns a single listing with its content", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const listing = yield* AtomRegistry.getResult(registry, listingAtom);
      assert.instanceOf(listing, ExploreListing);
      assert.strictEqual(listing.card.slug, "debugging-playbook");
      assert.strictEqual(listing.card.kind, "skill");
      assert.isAbove(listing.card.description.length, 0);
      assert.strictEqual(listing.content.kind, "skill");
      assert.isAbove(listing.versions.length, 0);
    }),
  );

  it.effect("serves no wallpaper image, so a cover draws its palette", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const image = yield* AtomRegistry.getResult(registry, wallpaperAtom);
      assert.notProperty(image ?? {}, "url");
    }),
  );
});
