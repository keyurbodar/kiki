import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ApiKeysGroup extends HttpApiGroup.make("apiKeys").add(
  HttpApiEndpoint.post("mint", "/orgs/:orgId/api-keys", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/api-keys", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("rename", "/orgs/:orgId/api-keys/:keyId", {
    params: { orgId: Schema.String, keyId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("revoke", "/orgs/:orgId/api-keys/:keyId/revoke", {
    params: { orgId: Schema.String, keyId: Schema.String },
    success: Undecoded,
  }),
) {}
