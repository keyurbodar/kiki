import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ReposGroup extends HttpApiGroup.make("repos").add(
  HttpApiEndpoint.get("branches", "/orgs/:orgId/repos/branches", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("skills", "/orgs/:orgId/repos/skills", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("tree", "/orgs/:orgId/repos/tree", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
