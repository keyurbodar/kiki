import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import {
  CloudAccess,
  CloudAccessTarget,
  CreateCloudAccessTargetRequest,
  UpdateCloudAccessTargetRequest,
} from "../schemas/cloud-access.ts";
import { IntegrationMutationResult } from "../schemas/integrations.ts";

export class CloudAccessGroup extends HttpApiGroup.make("cloud-access").add(
  HttpApiEndpoint.get("getCloudAccess", "/orgs/:orgId/cloud-access", {
    params: { orgId: Schema.String },
    success: CloudAccess,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "createCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets",
    {
      params: { orgId: Schema.String },
      payload: CreateCloudAccessTargetRequest,
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "updateCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: {
        orgId: Schema.String,
        targetId: Schema.String,
      },
      payload: UpdateCloudAccessTargetRequest,
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "deleteCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: {
        orgId: Schema.String,
        targetId: Schema.String,
      },
      success: IntegrationMutationResult,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "checkCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId/check",
    {
      params: {
        orgId: Schema.String,
        targetId: Schema.String,
      },
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
) {}
