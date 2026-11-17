import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  ApiKey,
  ApiKeyId,
  ApiKeyNotFound,
  Forbidden,
  InvalidRequest,
  MintApiKeyRequest,
  MintedApiKey,
  RenameApiKeyRequest,
} from "../schemas/api-keys.ts";
import { OrgId } from "../schemas/ids.ts";

export class ApiKeysGroup extends HttpApiGroup.make("apiKeys").add(
  HttpApiEndpoint.post("mint", "/orgs/:orgId/api-keys", {
    params: { orgId: OrgId },
    payload: MintApiKeyRequest,
    success: MintedApiKey,
    error: [Forbidden, InvalidRequest],
  }),
  HttpApiEndpoint.get("list", "/orgs/:orgId/api-keys", {
    params: { orgId: OrgId },
    success: Schema.Array(ApiKey),
  }),
  HttpApiEndpoint.patch("rename", "/orgs/:orgId/api-keys/:keyId", {
    params: { orgId: OrgId, keyId: ApiKeyId },
    payload: RenameApiKeyRequest,
    success: ApiKey,
    error: [ApiKeyNotFound, InvalidRequest],
  }),
  HttpApiEndpoint.post("revoke", "/orgs/:orgId/api-keys/:keyId/revoke", {
    params: { orgId: OrgId, keyId: ApiKeyId },
    success: ApiKey,
    error: ApiKeyNotFound,
  }),
) {}
