import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class OperationsGroup extends HttpApiGroup.make("operations").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/operations", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "cancelSubscription",
    "/orgs/:orgId/jams/:jamId/operations/:operationId/cancel",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        operationId: Schema.String,
      },
      success: Undecoded,
    },
  ),
) {}
