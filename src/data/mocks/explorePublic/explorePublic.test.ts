import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";

interface Icon {
  readonly url: string;
  readonly mimeType: string;
}

interface ListingSummary {
  readonly kind: string;
  readonly slug: string;
  readonly displayName: string;
  readonly icon: Icon;
}

interface Listing extends ListingSummary {
  readonly description: string;
  readonly authorId: string;
  readonly wallpaper: Icon;
}

const iconAtom = ApiClient.query("explorePublic", "icon", {
  params: { kind: "plugin", slug: "release-notes" },
});
const listingsAtom = ApiClient.query("explorePublic", "listings", {
  query: {},
});
const listingAtom = ApiClient.query("explorePublic", "listing", {
  params: { kind: "skill", slug: "code-review" },
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
      assert.include(icon.url, "/plugin/release-notes.png");
      assert.strictEqual(icon.mimeType, "image/png");
    }),
  );

  it.effect("serves Capy's ExploreIndex without an org id", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const index = yield* AtomRegistry.getResult(registry, listingsAtom);
      assert.isAbove(index.cards.length, 0);
      assert.deepStrictEqual(index.added, []);
      assert.isTrue(
        index.cards.some((card) => card.kind === "plugin") &&
          index.cards.some((card) => card.kind === "skill") &&
          index.cards.some((card) => card.kind === "theme"),
      );
    }),
  );

  it.effect("filters the index by kind and search text", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const index = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("explorePublic", "listings", {
          query: { kind: "plugin", q: "deploy" },
        }),
      );
      assert.isAbove(index.cards.length, 0);
      assert.isTrue(index.cards.every((card) => card.kind === "plugin"));
    }),
  );

  it.effect("returns a single listing with its wallpaper", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const listing = (yield* AtomRegistry.getResult(
        registry,
        listingAtom,
      )) as Listing;
      assert.strictEqual(listing.slug, "code-review");
      assert.strictEqual(listing.kind, "skill");
      assert.isAbove(listing.description.length, 0);
      assert.isAbove(listing.authorId.length, 0);
      assert.include(listing.wallpaper.url, "/themes/code-review.png");
    }),
  );

  it.effect("returns a wallpaper image for a preset theme", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const image = (yield* AtomRegistry.getResult(
        registry,
        wallpaperAtom,
      )) as Icon;
      assert.include(image.url, "/themes/absolutely.png");
      assert.strictEqual(image.mimeType, "image/png");
    }),
  );
});
