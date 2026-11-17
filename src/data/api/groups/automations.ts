import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class AutomationsGroup extends HttpApiGroup.make("automations").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/automations", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("create", "/orgs/:orgId/automations", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("get", "/orgs/:orgId/automations/:automationId", {
    params: { orgId: Schema.String, automationId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/automations/:automationId", {
    params: { orgId: Schema.String, automationId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listBatches",
    "/orgs/:orgId/automations/:automationId/batches",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "cancelBatch",
    "/orgs/:orgId/automations/:automationId/batches/:batchId/cancel",
    {
      params: {
        orgId: Schema.String,
        automationId: Schema.String,
        batchId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "flushBatch",
    "/orgs/:orgId/automations/:automationId/batches/:batchId/flush",
    {
      params: {
        orgId: Schema.String,
        automationId: Schema.String,
        batchId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "delete",
    "/orgs/:orgId/automations/:automationId/delete",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "disable",
    "/orgs/:orgId/automations/:automationId/disable",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "enable",
    "/orgs/:orgId/automations/:automationId/enable",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "restore",
    "/orgs/:orgId/automations/:automationId/restore",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "cancel",
    "/orgs/:orgId/automations/:automationId/runs/:runId/cancel",
    {
      params: {
        orgId: Schema.String,
        automationId: Schema.String,
        runId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "trigger",
    "/orgs/:orgId/automations/:automationId/trigger",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("usage", "/orgs/:orgId/automations/:automationId/usage", {
    params: { orgId: Schema.String, automationId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "rotateWebhook",
    "/orgs/:orgId/automations/:automationId/webhook/rotate",
    {
      params: { orgId: Schema.String, automationId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listPage", "/orgs/:orgId/automations/page", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
