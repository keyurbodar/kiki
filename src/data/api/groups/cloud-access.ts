import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class CloudAccessGroup extends HttpApiGroup.make("cloud-access").add(
  HttpApiEndpoint.get("getCloudAccess", "/orgs/:orgId/cloud-access", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "createCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "updateCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: { orgId: Schema.String, targetId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "deleteCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: { orgId: Schema.String, targetId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "checkCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId/check",
    {
      params: { orgId: Schema.String, targetId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
