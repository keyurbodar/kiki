import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { vi } from "vitest";
import {
  type ExploreCard,
  ExploreListing,
  ExploreNotFound,
} from "../../api/schemas/explore.ts";
import { ApiClient } from "../../client/ApiClient.ts";

interface Icon {
  readonly url: string;
  readonly mimeType: string;
}

const iconAtom = ApiClient.query("explorePublic", "icon", {
  params: { kind: "plugin", slug: "cloudflare" },
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
/**
 * The offline build answers the image endpoint with the bundled file; here the
 * file is a four-byte stand-in so the bytes themselves can be read back.
 */
vi.mock("@/assets/wallpapers", () => ({
  wallpaperAsset: (slug: string) =>
    slug === "holy-night"
      ? {
          url: "data:image/webp;base64,UklGRg==",
          name: "Witch on the Holy Night",
          contentType: "image/webp",
          size: 8,
          digest:
            "8c0cd7184fb8d439af90c1b71192a87b1e08ea28287db8f13dc5c02de5329a87",
        }
      : undefined,
}));

const wallpaperAtom = ApiClient.query("explorePublic", "wallpaperImage", {
  params: { slug: "holy-night" },
  query: {},
});

describe("explorePublic mock", () => {
  it.effect("returns icons for a known listing", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const icon = (yield* AtomRegistry.getResult(registry, iconAtom)) as Icon;
      assert.include(icon.url, "/plugin/cloudflare.png");
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

  it.effect("serves a theme's wallpaper as the image bytes", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const image = yield* AtomRegistry.getResult(registry, wallpaperAtom);
      assert.instanceOf(image, Uint8Array);
      assert.deepEqual(Array.from(image.slice(0, 4)), [82, 73, 70, 70]);
    }),
  );

  it.effect(
    "answers ExploreNotFound for an icon the catalog does not carry",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const calls = [
          { kind: "plugin", slug: "no_such_plugin" },
          { kind: "skill", slug: "no_such_skill" },
          { kind: "bogus", slug: "cloudflare" },
        ];
        for (const params of calls) {
          const atom = ApiClient.query("explorePublic", "icon", { params });
          const error = yield* AtomRegistry.getResult(
            registry,
            atom as never,
          ).pipe(Effect.flip);
          assert.instanceOf(error, ExploreNotFound);
        }
      }),
  );
});
