import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class MobileSessionsGroup extends HttpApiGroup.make(
  "mobileSessions",
).add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/mobile-sessions", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/mobile-sessions/:sessionId", {
    params: { orgId: Schema.String, sessionId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("stop", "/orgs/:orgId/mobile-sessions/:sessionId/stop", {
    params: { orgId: Schema.String, sessionId: Schema.String },
    success: Undecoded,
  }),
) {}
