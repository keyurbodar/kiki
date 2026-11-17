import { Effect, Ref } from "effect";
import { ExploreIndex } from "../../api/schemas/explore.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type ListingKind,
  listingKinds,
  sampleIndexCards,
  sampleListings,
} from "./fixtures.ts";

const isListingKind = (value: string): value is ListingKind =>
  listingKinds.some((kind) => kind === value);

export const ExplorePublicMock = mockGroup("explorePublic", (handlers) =>
  Effect.gen(function* () {
    const listings = yield* Ref.make(sampleListings);
    const indexCards = yield* Ref.make(sampleIndexCards);

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
          const cards = yield* Ref.get(indexCards);
          const search = query.q?.toLowerCase();
          return new ExploreIndex({
            cards: cards
              .filter(
                (card) => query.kind === undefined || card.kind === query.kind,
              )
              .filter(
                (card) =>
                  search === undefined ||
                  card.displayName.toLowerCase().includes(search) ||
                  card.description.toLowerCase().includes(search),
              ),
            added: [],
          });
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
