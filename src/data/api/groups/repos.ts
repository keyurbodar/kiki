import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ReposGroup extends HttpApiGroup.make("repos").add(
  HttpApiEndpoint.get("branches", "/orgs/:orgId/repos/branches", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("skills", "/orgs/:orgId/repos/skills", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("tree", "/orgs/:orgId/repos/tree", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
