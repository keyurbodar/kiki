import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class RestoreGroup extends HttpApiGroup.make("restore").add(
  HttpApiEndpoint.post("restore", "/orgs/:orgId/restore", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
