import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Forbidden } from "../schemas/errors.ts";
import { Undecoded } from "../undecoded.ts";

export class OrgsGroup extends HttpApiGroup.make("orgs").add(
  HttpApiEndpoint.put("update", "/orgs/:orgId", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
    error: Forbidden,
  }),
  HttpApiEndpoint.delete("delete", "/orgs/:orgId", {
    params: { orgId: Schema.String },
    success: Undecoded,
    error: Forbidden,
  }),
) {}
