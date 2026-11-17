import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class OrgsGroup extends HttpApiGroup.make("orgs").add(
  HttpApiEndpoint.put("update", "/orgs/:orgId", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("delete", "/orgs/:orgId", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
