import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import {
  CancelMessageOutcome,
  ContextUsage,
  SendNowOutcome,
} from "../../events/events.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class EventsGroup extends HttpApiGroup.make("events").add(
  HttpApiEndpoint.post("compact", "/orgs/:orgId/jams/:jamId/compact", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/events", {
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.get(
    "contextUsage",
    "/orgs/:orgId/jams/:jamId/events/context-usage",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: ContextUsage,
      error: HttpApiError.NotFoundNoContent,
    },
  ),
  HttpApiEndpoint.get("outline", "/orgs/:orgId/jams/:jamId/events/outline", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.get("stream", "/orgs/:orgId/jams/:jamId/events/stream", {
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("interrupt", "/orgs/:orgId/jams/:jamId/interrupt", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.post("message", "/orgs/:orgId/jams/:jamId/message", {
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
    error: HttpApiError.NotFoundNoContent,
  }),
  HttpApiEndpoint.post(
    "cancelMessage",
    "/orgs/:orgId/jams/:jamId/messages/:eventId/cancel",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        eventId: Schema.String,
      },
      success: CancelMessageOutcome,
      error: HttpApiError.NotFoundNoContent,
    },
  ),
  HttpApiEndpoint.post(
    "sendNowMessage",
    "/orgs/:orgId/jams/:jamId/messages/:eventId/send-now",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        eventId: Schema.String,
      },
      success: SendNowOutcome,
      error: HttpApiError.NotFoundNoContent,
    },
  ),
  HttpApiEndpoint.get(
    "messageVersions",
    "/orgs/:orgId/jams/:jamId/messages/:eventId/versions",
    {
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        eventId: Schema.String,
      },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ),
) {}
