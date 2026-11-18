import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class HandoffsGroup extends HttpApiGroup.make("handoffs").add(
  HttpApiEndpoint.post("open", "/orgs/:orgId/jams/:jamId/handoff", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/jams/:jamId/handoff", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "cancel",
    "/orgs/:orgId/jams/:jamId/handoff/:handoffId/cancel",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        handoffId: Schema.String,
      },
      success: Undecoded,
    },
  ),
) {}
