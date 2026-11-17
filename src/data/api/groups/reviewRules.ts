import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ReviewRulesGroup extends HttpApiGroup.make("reviewRules").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/review-rules", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/review-rules", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/review-rules/:id", {
    params: { orgId: Schema.String, id: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/review-rules/:id", {
    params: { orgId: Schema.String, id: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("remove", "/orgs/:orgId/review-rules/:id", {
    params: { orgId: Schema.String, id: Schema.String },
    success: Undecoded,
  }),
) {}
