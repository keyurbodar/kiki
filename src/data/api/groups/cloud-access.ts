import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import {
  CloudAccess,
  CloudAccessTarget,
  CloudAccessTargetId,
  CreateCloudAccessTargetRequest,
  UpdateCloudAccessTargetRequest,
} from "../schemas/cloud-access.ts";
import { OrgId } from "../schemas/ids.ts";
import { IntegrationMutationResult } from "../schemas/integrations.ts";

export class CloudAccessGroup extends HttpApiGroup.make("cloud-access").add(
  HttpApiEndpoint.get("getCloudAccess", "/orgs/:orgId/cloud-access", {
    params: { orgId: OrgId },
    success: CloudAccess,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "createCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets",
    {
      params: { orgId: OrgId },
      payload: CreateCloudAccessTargetRequest,
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.patch(
    "updateCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: { orgId: OrgId, targetId: CloudAccessTargetId },
      payload: UpdateCloudAccessTargetRequest,
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.delete(
    "deleteCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId",
    {
      params: { orgId: OrgId, targetId: CloudAccessTargetId },
      success: IntegrationMutationResult,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "checkCloudAccessTarget",
    "/orgs/:orgId/cloud-access/targets/:targetId/check",
    {
      params: { orgId: OrgId, targetId: CloudAccessTargetId },
      success: CloudAccessTarget,
    },
  ).annotate(InferredMethod, true),
) {}
