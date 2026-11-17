import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class AuditGroup extends HttpApiGroup.make("audit").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/audit-events", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
