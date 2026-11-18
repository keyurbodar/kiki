import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  ExploreListing,
  ExploreNotFound,
  ExploreRateLimited,
  ImageBytes,
  ListingKind,
  ListingSlug,
} from "../schemas/explore.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ExplorePublicGroup extends HttpApiGroup.make("explorePublic").add(
  HttpApiEndpoint.get("icon", "/explore/icons/:kind/:slug", {
    params: { kind: Schema.String, slug: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listings", "/explore/listings", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listing", "/explore/listings/:kind/:slug", {
    params: { kind: ListingKind, slug: ListingSlug },
    success: ExploreListing,
    error: [ExploreNotFound, ExploreRateLimited],
  }),
  HttpApiEndpoint.get("wallpaperImage", "/explore/themes/:slug/wallpaper", {
    params: { slug: Schema.String },
    query: UndecodedQuery,
    success: ImageBytes,
    error: [ExploreNotFound],
  }),
) {}
