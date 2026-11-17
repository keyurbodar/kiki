import { Effect, Ref } from "effect";
import { mockGroup } from "../mockGroup.ts";
import {
  type ListingKind,
  listingKinds,
  type PublicListing,
  sampleListings,
} from "./fixtures.ts";

const isListingKind = (value: string): value is ListingKind =>
  listingKinds.some((kind) => kind === value);

const listingSummary = (listing: PublicListing) => ({
  kind: listing.kind,
  slug: listing.slug,
  name: listing.name,
  displayName: listing.displayName,
  description: listing.description,
  authorId: listing.authorId,
  icon: listing.icon,
  featured: listing.featured,
  installs: listing.installs,
  rating: listing.rating,
  updatedAt: listing.updatedAt,
});

const queryValue = (
  query: Record<string, string | ReadonlyArray<string>>,
  key: string,
) => {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
};

export const ExplorePublicMock = mockGroup("explorePublic", (handlers) =>
  Effect.gen(function* () {
    const listings = yield* Ref.make(sampleListings);

    return handlers
      .handle("icon", ({ params }) =>
        Effect.gen(function* () {
          if (!isListingKind(params.kind)) {
            return yield* Effect.die(
              new Error(`explorePublic.icon: unknown kind ${params.kind}`),
            );
          }
          const rows = yield* Ref.get(listings);
          const listing = rows.find(
            (row) => row.kind === params.kind && row.slug === params.slug,
          );
          if (!listing) {
            return yield* Effect.die(
              new Error(
                `explorePublic.icon: no ${params.kind} listing ${params.slug}`,
              ),
            );
          }
          return listing.icon;
        }),
      )
      .handle("listings", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(listings);
          const kind = queryValue(query, "kind");
          const search = queryValue(query, "q")?.toLowerCase();
          const featured = queryValue(query, "featured");
          return rows
            .filter((row) => kind === undefined || row.kind === kind)
            .filter(
              (row) =>
                search === undefined ||
                row.displayName.toLowerCase().includes(search) ||
                row.description.toLowerCase().includes(search),
            )
            .filter(
              (row) =>
                featured === undefined ||
                row.featured === (featured === "true"),
            )
            .map(listingSummary);
        }),
      )
      .handle("listing", ({ params }) =>
        Effect.gen(function* () {
          if (!isListingKind(params.kind)) {
            return yield* Effect.die(
              new Error(`explorePublic.listing: unknown kind ${params.kind}`),
            );
          }
          const rows = yield* Ref.get(listings);
          const listing = rows.find(
            (row) => row.kind === params.kind && row.slug === params.slug,
          );
          if (!listing) {
            return yield* Effect.die(
              new Error(
                `explorePublic.listing: no ${params.kind} listing ${params.slug}`,
              ),
            );
          }
          return listing;
        }),
      )
      .handle("wallpaperImage", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(listings);
          const listing = rows.find(
            (row) => row.kind === "theme" && row.slug === params.slug,
          );
          if (!listing) {
            return yield* Effect.die(
              new Error(
                `explorePublic.wallpaperImage: no theme ${params.slug}`,
              ),
            );
          }
          return listing.wallpaper;
        }),
      );
  }),
);
