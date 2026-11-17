import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  ApiKey,
  ApiKeyNotFound,
  Forbidden,
  InvalidRequest,
  MintApiKeyRequest,
  MintedApiKey,
  RenameApiKeyRequest,
} from "../schemas/api-keys.ts";

export class ApiKeysGroup extends HttpApiGroup.make("apiKeys").add(
  HttpApiEndpoint.post("mint", "/orgs/:orgId/api-keys", {
    params: { orgId: Schema.String },
    payload: MintApiKeyRequest,
    success: MintedApiKey,
    error: [Forbidden, InvalidRequest],
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/api-keys", {
    params: { orgId: Schema.String },
    success: Schema.Array(ApiKey),
  }),
  HttpApiEndpoint.patch("rename", "/orgs/:orgId/api-keys/:keyId", {
    params: {
      orgId: Schema.String,
      keyId: Schema.String,
    },
    payload: RenameApiKeyRequest,
    success: ApiKey,
    error: [ApiKeyNotFound, InvalidRequest],
  }),
  HttpApiEndpoint.post("revoke", "/orgs/:orgId/api-keys/:keyId/revoke", {
    params: {
      orgId: Schema.String,
      keyId: Schema.String,
    },
    success: ApiKey,
    error: ApiKeyNotFound,
  }),
) {}
