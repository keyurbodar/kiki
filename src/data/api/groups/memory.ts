import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class MemoryGroup extends HttpApiGroup.make("memory").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/memory", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("read", "/orgs/:orgId/memory/:volumeId", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("edit", "/orgs/:orgId/memory/:volumeId/edit", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("forget", "/orgs/:orgId/memory/:volumeId/forget", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("restore", "/orgs/:orgId/memory/:volumeId/restore", {
    params: { orgId: Schema.String, volumeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
