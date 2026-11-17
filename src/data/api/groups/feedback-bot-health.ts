import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class FeedbackBotHealthGroup extends HttpApiGroup.make(
  "feedback-bot-health",
).add(
  HttpApiEndpoint.get("feedbackBotHealth", "/orgs/:orgId/feedback-bot-health", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
