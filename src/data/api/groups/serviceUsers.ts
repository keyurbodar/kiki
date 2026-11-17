import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  CreateServiceUserRequest,
  Forbidden,
  InvalidRequest,
  ReplaceServiceUserProjectsRequest,
  ServiceUser,
  ServiceUserDetail,
  ServiceUserNotFound,
  SetServiceUserSubscriptionRequest,
  UpdateServiceUserRequest,
} from "../schemas/api-keys.ts";
import { OrgId, ServiceUserId } from "../schemas/ids.ts";

const params = { orgId: OrgId, serviceUserId: ServiceUserId };

export class ServiceUsersGroup extends HttpApiGroup.make("serviceUsers").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/service-users", {
    params: { orgId: OrgId },
    success: Schema.Array(ServiceUser),
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/service-users", {
    params: { orgId: OrgId },
    payload: CreateServiceUserRequest,
    success: ServiceUserDetail,
    error: [Forbidden, InvalidRequest, ServiceUserNotFound],
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/service-users/:serviceUserId", {
    params,
    success: ServiceUserDetail,
    error: ServiceUserNotFound,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/service-users/:serviceUserId", {
    params,
    payload: UpdateServiceUserRequest,
    success: ServiceUserDetail,
    error: [Forbidden, InvalidRequest, ServiceUserNotFound],
  }),
  HttpApiEndpoint.post(
    "disable",
    "/orgs/:orgId/service-users/:serviceUserId/disable",
    { params, success: ServiceUserDetail, error: ServiceUserNotFound },
  ),
  HttpApiEndpoint.put(
    "replaceProjects",
    "/orgs/:orgId/service-users/:serviceUserId/projects",
    {
      params,
      payload: ReplaceServiceUserProjectsRequest,
      success: ServiceUserDetail,
      error: [InvalidRequest, ServiceUserNotFound],
    },
  ),
  HttpApiEndpoint.post(
    "restore",
    "/orgs/:orgId/service-users/:serviceUserId/restore",
    { params, success: ServiceUserDetail, error: ServiceUserNotFound },
  ),
  HttpApiEndpoint.put(
    "setSubscription",
    "/orgs/:orgId/service-users/:serviceUserId/subscription",
    {
      params,
      payload: SetServiceUserSubscriptionRequest,
      success: ServiceUserDetail,
      error: [Forbidden, InvalidRequest, ServiceUserNotFound],
    },
  ),
) {}
