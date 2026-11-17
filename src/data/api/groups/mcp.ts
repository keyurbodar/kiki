import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { CompleteMcpOAuthRequest, McpOAuthCompletion } from "../schemas/mcp.ts";
import { Undecoded } from "../undecoded.ts";

export class McpGroup extends HttpApiGroup.make("mcp").add(
  HttpApiEndpoint.post("resolveFavicon", "/mcp/favicon/resolve", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("completeOAuth", "/mcp/oauth/complete", {
    payload: CompleteMcpOAuthRequest,
    success: McpOAuthCompletion,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listSetups", "/orgs/:orgId/jams/:jamId/mcp-setups", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listServers", "/orgs/:orgId/mcp-servers", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("createServer", "/orgs/:orgId/mcp-servers", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch("updateServer", "/orgs/:orgId/mcp-servers/:serverId", {
    params: { orgId: Schema.String, serverId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listConnections",
    "/orgs/:orgId/mcp-servers/:serverId/connections",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "deleteServer",
    "/orgs/:orgId/mcp-servers/:serverId/delete",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disableServer",
    "/orgs/:orgId/mcp-servers/:serverId/disable",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disconnectCredential",
    "/orgs/:orgId/mcp-servers/:serverId/disconnect",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "enableServer",
    "/orgs/:orgId/mcp-servers/:serverId/enable",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "startOAuth",
    "/orgs/:orgId/mcp-servers/:serverId/oauth/start",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "refreshServer",
    "/orgs/:orgId/mcp-servers/:serverId/refresh",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "getSecretValue",
    "/orgs/:orgId/mcp-servers/:serverId/secrets/:position/:name/value",
    {
      params: {
        orgId: Schema.String,
        serverId: Schema.String,
        position: Schema.String,
        name: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "testServer",
    "/orgs/:orgId/mcp-servers/:serverId/test",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "serverTools",
    "/orgs/:orgId/mcp-servers/:serverId/tools",
    {
      params: { orgId: Schema.String, serverId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("probeDraft", "/orgs/:orgId/mcp-servers/probe", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("createSetup", "/orgs/:orgId/mcp-setups", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getSetup", "/orgs/:orgId/mcp-setups/:setupId", {
    params: { orgId: Schema.String, setupId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "completeSetup",
    "/orgs/:orgId/mcp-setups/:setupId/complete",
    {
      params: { orgId: Schema.String, setupId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("retrySetup", "/orgs/:orgId/mcp-setups/:setupId/retry", {
    params: { orgId: Schema.String, setupId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
