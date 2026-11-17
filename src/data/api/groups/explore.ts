import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  AddSkillRequest,
  AddSkillResult,
  ExploreIndex,
  ExploreNotFound,
  ReportListingRequest,
} from "../schemas/explore.ts";
import { UndecodedQuery } from "../undecoded.ts";

export const ExploreThemeVisibility = Schema.Struct({
  hidden: Schema.Boolean,
}).annotate({ identifier: "ExploreThemeVisibility" });

export const ThemeVisibilityRequest = Schema.Struct({
  hidden: Schema.Boolean,
}).annotate({ identifier: "ThemeVisibilityRequest" });

export class ExploreGroup extends HttpApiGroup.make("explore").add(
  HttpApiEndpoint.get("listings", "/orgs/:orgId/explore/listings", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: ExploreIndex,
  }),
  HttpApiEndpoint.post("report", "/orgs/:orgId/explore/reports", {
    params: { orgId: Schema.String },
    payload: ReportListingRequest,
    success: Schema.Void,
    error: ExploreNotFound,
  }),
  HttpApiEndpoint.post("addSkill", "/orgs/:orgId/explore/skills/add", {
    params: { orgId: Schema.String },
    payload: AddSkillRequest,
    success: AddSkillResult,
    error: ExploreNotFound,
  }),
  HttpApiEndpoint.get("themeVisibility", "/admin/explore/themes/:slug", {
    params: { slug: Schema.String },
    success: ExploreThemeVisibility,
  }),
  HttpApiEndpoint.put(
    "setThemeVisibility",
    "/admin/explore/themes/:slug/hidden",
    {
      params: { slug: Schema.String },
      payload: ThemeVisibilityRequest,
      success: ExploreThemeVisibility,
    },
  ),
) {}
