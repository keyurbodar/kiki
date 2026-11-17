import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class FeedbackBotsGroup extends HttpApiGroup.make("feedback-bots").add(
  HttpApiEndpoint.get("feedbackBots", "/orgs/:orgId/feedback-bots", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
