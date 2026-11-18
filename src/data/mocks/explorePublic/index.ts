import { Effect, Schema } from "effect";
import { wallpaperAsset } from "@/assets/wallpapers";
import {
  ExploreCard,
  ExploreNotFound,
  type ListingKind,
} from "../../api/schemas/explore.ts";
import { mockGroup } from "../mockGroup.ts";
import { findSampleListing, sampleListings } from "./fixtures.ts";

/** The bundled image an offline build serves where Capy serves its own bytes. */
const loaded = new Map<string, Promise<Uint8Array>>();

const wallpaperBytes = (url: string) => {
  const cached = loaded.get(url);
  if (cached !== undefined) return cached;
  const bytes = fetch(url).then(async (response) =>
    response.ok
      ? new Uint8Array(await response.arrayBuffer())
      : Promise.reject(new Error(`explorePublic.wallpaperImage: ${url}`)),
  );
  loaded.set(url, bytes);
  return bytes;
};

const listingKinds: ReadonlyArray<ListingKind> = ["plugin", "skill", "theme"];

const isListingKind = (value: string): value is ListingKind =>
  listingKinds.some((kind) => kind === value);

const queryValue = (
  query: Record<string, string | ReadonlyArray<string>>,
  key: string,
) => {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
};

const plainCard = Schema.encodeSync(ExploreCard);

const iconFor = (kind: string, slug: string) => ({
  url: `https://icons.example.com/explore/${kind}/${slug}.png`,
  mimeType: "image/png",
});

export const ExplorePublicMock = mockGroup("explorePublic", (handlers) =>
  Effect.succeed(
    handlers
      .handle("icon", ({ params }) =>
        Effect.gen(function* () {
          if (!isListingKind(params.kind)) {
            return yield* Effect.fail(
              new ExploreNotFound({ kind: params.kind, slug: params.slug }),
            );
          }
          if (findSampleListing(params.kind, params.slug) === undefined) {
            return yield* Effect.fail(
              new ExploreNotFound({ kind: params.kind, slug: params.slug }),
            );
          }
          return iconFor(params.kind, params.slug);
        }),
      )
      .handle("listings", ({ query }) => {
        const kind = queryValue(query, "kind");
        const search = (
          queryValue(query, "search") ?? queryValue(query, "q")
        )?.toLowerCase();
        const featured = queryValue(query, "featured");
        return Effect.succeed(
          sampleListings
            .map((listing) => listing.card)
            .filter((card) => kind === undefined || card.kind === kind)
            .filter(
              (card) =>
                search === undefined ||
                card.displayName.toLowerCase().includes(search) ||
                card.description.toLowerCase().includes(search) ||
                card.slug.includes(search),
            )
            .filter(
              (card) =>
                featured === undefined ||
                (card.featuredRank !== null) === (featured === "true"),
            )
            .map((card) => plainCard(card)),
        );
      })
      .handle("listing", ({ params }) => {
        const listing = findSampleListing(params.kind, params.slug);
        return listing === undefined
          ? Effect.fail(
              new ExploreNotFound({ kind: params.kind, slug: params.slug }),
            )
          : Effect.succeed(listing);
      })
      .handle("wallpaperImage", ({ params }) => {
        const asset = wallpaperAsset(params.slug);
        return asset === undefined
          ? Effect.fail(
              new ExploreNotFound({ kind: "theme", slug: params.slug }),
            )
          : Effect.promise(() => wallpaperBytes(asset.url));
      }),
  ),
);
