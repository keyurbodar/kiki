import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ReviewDefaultSettingsGroup extends HttpApiGroup.make(
  "reviewDefaultSettings",
).add(
  HttpApiEndpoint.get("getOrg", "/orgs/:orgId/review-defaults", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setOrg", "/orgs/:orgId/review-defaults", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
