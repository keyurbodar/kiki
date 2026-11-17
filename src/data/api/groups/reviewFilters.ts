import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ReviewFiltersGroup extends HttpApiGroup.make("reviewFilters").add(
  HttpApiEndpoint.get(
    "listIgnorePaths",
    "/orgs/:orgId/review-filters/ignore-paths",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.post(
    "createIgnorePaths",
    "/orgs/:orgId/review-filters/ignore-paths",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.patch(
    "updateIgnorePaths",
    "/orgs/:orgId/review-filters/ignore-paths/:id",
    {
      params: { orgId: Schema.String, id: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "deleteIgnorePaths",
    "/orgs/:orgId/review-filters/ignore-paths/:id",
    { params: { orgId: Schema.String, id: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.get("listRules", "/orgs/:orgId/review-filters/rules", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createRule", "/orgs/:orgId/review-filters/rules", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateRule", "/orgs/:orgId/review-filters/rules/:id", {
    params: { orgId: Schema.String, id: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "deleteRule",
    "/orgs/:orgId/review-filters/rules/:id",
    { params: { orgId: Schema.String, id: Schema.String }, success: Undecoded },
  ),
) {}
