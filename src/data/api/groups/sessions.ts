import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

/**
 * The browser and terminal sessions a thread opens. A session tab is
 * session-scoped in Capy: `browser:<sessionId>` and
 * `shell:<machineId>:<clientId>` exist in the document that opened them and are
 * never reopenable from a URL, so this is a list by thread rather than a set of
 * addressable panes.
 */
export class ThreadSessionsGroup extends HttpApiGroup.make(
  "threadSessions",
).add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/sessions", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
