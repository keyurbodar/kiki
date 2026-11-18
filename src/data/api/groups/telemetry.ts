import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class TelemetryGroup extends HttpApiGroup.make("telemetry").add(
  HttpApiEndpoint.get("listIssues", "/orgs/:orgId/browser-issues", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "ignoreIssue",
    "/orgs/:orgId/browser-issues/:issueId/ignore",
    {
      params: { orgId: Schema.String, issueId: Schema.String },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "resolveIssue",
    "/orgs/:orgId/browser-issues/:issueId/resolve",
    {
      params: { orgId: Schema.String, issueId: Schema.String },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "unignoreIssue",
    "/orgs/:orgId/browser-issues/:issueId/unignore",
    {
      params: { orgId: Schema.String, issueId: Schema.String },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "unresolveIssue",
    "/orgs/:orgId/browser-issues/:issueId/unresolve",
    {
      params: { orgId: Schema.String, issueId: Schema.String },
      success: Undecoded,
      error: HttpApiError.NotFoundNoContent,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("ingestErrors", "/orgs/:orgId/telemetry/errors", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("ingestSpans", "/orgs/:orgId/telemetry/spans", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
