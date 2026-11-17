import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ReviewsGroup extends HttpApiGroup.make("reviews").add(
  HttpApiEndpoint.get(
    "getSelfAuthorPolicy",
    "/orgs/:orgId/review-author-policy/self",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.put(
    "setSelfAuthorPolicy",
    "/orgs/:orgId/review-author-policy/self",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("listSettings", "/orgs/:orgId/review-settings", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("configure", "/orgs/:orgId/review-settings", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
