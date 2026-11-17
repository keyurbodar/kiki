import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class FeedbackSettingsGroup extends HttpApiGroup.make(
  "feedback-settings",
).add(
  HttpApiEndpoint.get("feedbackSettings", "/orgs/:orgId/feedback-settings", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("configureFeedback", "/orgs/:orgId/feedback-settings", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
