import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ChildrenGroup extends HttpApiGroup.make("children").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/children", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("page", "/orgs/:orgId/jams/:jamId/children/page", {
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("taskThread", "/orgs/:orgId/tasks/:taskId/thread", {
    params: { orgId: Schema.String, taskId: Schema.String },
    success: Undecoded,
  }),
) {}
