import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

/**
 * The pull guide behind the Guide tab. Capy reads the same document through
 * `pulls.summaryLatest`; this exposes it as one readable resource so the guide
 * has its own mock instead of borrowing the pulls fixtures.
 */
export class PullGuidesGroup extends HttpApiGroup.make("pullGuides").add(
  HttpApiEndpoint.get("get", "/orgs/:orgId/pulls/:pullId/guide", {
    params: { orgId: Schema.String, pullId: Schema.String },
    success: Undecoded,
  }),
) {}
