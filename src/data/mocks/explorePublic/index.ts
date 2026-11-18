import { Effect, Schema } from "effect";
import {
  ExploreCard,
  ExploreNotFound,
  type ListingKind,
} from "../../api/schemas/explore.ts";
import { mockGroup } from "../mockGroup.ts";
import { findSampleListing, sampleListings } from "./fixtures.ts";

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

const WALLPAPER_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAAAkCAIAAAC2bqvFAAAA1ElEQVR42tXCvUpCAQCA0e8BGoooEQmR4iIaIkWKiViSYpmSlPRncIeCqMEhJKhBiGhwKAgJnFpcWppaWpx6sJ7jOxxmZhfUmZuPqLMYiaoTkyMRX1InWI6rkw4S6mRTK+rkMoE6xbWkOlu5lDrVzVV1GqWMOgfbWXU61XV1znY31AmbeXWu2gV1bo6K6vROSur0u2V1HsKKOoPLHXWer2vqDG/r6rz19tQZ3e2rM75vqfP52FZnMjhU5+upo873y7E6P8NTdX5fz9WZvl+o8/cRqv8DBq+VuYRTNoEAAAAASUVORK5CYII=";

const wallpaperFor = (_slug: string) => ({
  url: `data:image/png;base64,${WALLPAPER_PNG}`,
  mimeType: "image/png",
});

export const ExplorePublicMock = mockGroup("explorePublic", (handlers) =>
  Effect.succeed(
    handlers
      .handle("icon", ({ params }) =>
        Effect.gen(function* () {
          if (!isListingKind(params.kind)) {
            return yield* Effect.die(
              new Error(`explorePublic.icon: unknown kind ${params.kind}`),
            );
          }
          if (findSampleListing(params.kind, params.slug) === undefined) {
            return yield* Effect.die(
              new Error(
                `explorePublic.icon: no ${params.kind} listing ${params.slug}`,
              ),
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
      .handle("wallpaperImage", ({ params }) =>
        Effect.succeed(wallpaperFor(params.slug)),
      ),
  ),
);
