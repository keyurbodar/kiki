import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class GitGroup extends HttpApiGroup.make("git").add(
  HttpApiEndpoint.get("blob", "/orgs/:orgId/jams/:jamId/git/blob", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("write", "/orgs/:orgId/jams/:jamId/git/file", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("manifest", "/orgs/:orgId/jams/:jamId/git/manifest", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("patch", "/orgs/:orgId/jams/:jamId/git/patch", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("status", "/orgs/:orgId/jams/:jamId/git/status", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "storedFile",
    "/orgs/:orgId/jams/:jamId/git/stored/file",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "storedTree",
    "/orgs/:orgId/jams/:jamId/git/stored/tree",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("tree", "/orgs/:orgId/jams/:jamId/git/tree", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("turns", "/orgs/:orgId/jams/:jamId/git/turns", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
