import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class IssueStatesGroup extends HttpApiGroup.make("issue-states").add(
  HttpApiEndpoint.delete("deleteState", "/orgs/:orgId/issue-states/:stateId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, stateId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setDefaultState",
    "/orgs/:orgId/issue-states/:stateId/default",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, stateId: Schema.String },
      success: Undecoded,
    },
  ),
) {}
