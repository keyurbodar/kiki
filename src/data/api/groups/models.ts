import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { InvalidRequest } from "../schemas/errors.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ModelsGroup extends HttpApiGroup.make("models").add(
  HttpApiEndpoint.get("list", "/models", {
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("disconnect", "/models/credentials/:service", {
    params: { service: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "setCredentialEnabled",
    "/models/credentials/:service",
    {
      params: { service: Schema.String },
      query: UndecodedQuery,
      payload: Undecoded,
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("startDevice", "/models/credentials/:service/device", {
    params: { service: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
    error: InvalidRequest,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "refreshClaudeSeat",
    "/models/credentials/claude/:credentialId/refresh",
    {
      params: { credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.put("connectClaudeSeat", "/models/credentials/claude/token", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "pollDevice",
    "/models/credentials/device/:attemptId/poll",
    {
      params: { attemptId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listMyCompactAt", "/orgs/:orgId/me/models/compact-at", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put(
    "upsertMyCompactAt",
    "/orgs/:orgId/me/models/compact-at",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "removeMyCompactAt",
    "/orgs/:orgId/me/models/compact-at",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listCompactAt", "/orgs/:orgId/models/compact-at", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("upsertCompactAt", "/orgs/:orgId/models/compact-at", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("removeCompactAt", "/orgs/:orgId/models/compact-at", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("connections", "/orgs/:orgId/models/connections", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put(
    "setConnectionModels",
    "/orgs/:orgId/models/connections/:credentialId/models",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.put(
    "reorderConnections",
    "/orgs/:orgId/models/connections/order",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("createCredential", "/orgs/:orgId/models/credentials", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "updateCredential",
    "/orgs/:orgId/models/credentials/:credentialId",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "removeCredential",
    "/orgs/:orgId/models/credentials/:credentialId",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "refreshDaybreak",
    "/orgs/:orgId/models/credentials/:credentialId/daybreak",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "checkMediaUrl",
    "/orgs/:orgId/models/credentials/:credentialId/media-check",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "moveToOrganization",
    "/orgs/:orgId/models/credentials/:credentialId/move-to-organization",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "testCredential",
    "/orgs/:orgId/models/credentials/:credentialId/test",
    {
      params: { orgId: Schema.String, credentialId: Schema.String },
      success: Undecoded,
      error: InvalidRequest,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("discoverModels", "/orgs/:orgId/models/discover", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
    error: InvalidRequest,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("upsertOrgKey", "/orgs/:orgId/models/keys/:provider", {
    params: { orgId: Schema.String, provider: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("removeOrgKey", "/orgs/:orgId/models/keys/:provider", {
    params: { orgId: Schema.String, provider: Schema.String },
    success: Undecoded,
    error: InvalidRequest,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("routing", "/orgs/:orgId/models/routing", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("getSettings", "/orgs/:orgId/models/settings", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("setModelSetting", "/orgs/:orgId/models/settings", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("setFallback", "/orgs/:orgId/models/settings/fallback", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put(
    "setMemberCredentials",
    "/orgs/:orgId/models/settings/members",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
