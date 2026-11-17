import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class IssueStatesGroup extends HttpApiGroup.make("issue-states").add(
  HttpApiEndpoint.delete("deleteState", "/orgs/:orgId/issue-states/:stateId", {
    params: { orgId: Schema.String, stateId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setDefaultState",
    "/orgs/:orgId/issue-states/:stateId/default",
    {
      params: { orgId: Schema.String, stateId: Schema.String },
      success: Undecoded,
    },
  ),
) {}
