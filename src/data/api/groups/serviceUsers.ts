import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ServiceUsersGroup extends HttpApiGroup.make("serviceUsers").add(
  HttpApiEndpoint.get("list", "/orgs/:orgId/service-users", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/service-users", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/service-users/:serviceUserId", {
    params: { orgId: Schema.String, serviceUserId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/service-users/:serviceUserId", {
    params: { orgId: Schema.String, serviceUserId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "disable",
    "/orgs/:orgId/service-users/:serviceUserId/disable",
    {
      params: { orgId: Schema.String, serviceUserId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "replaceProjects",
    "/orgs/:orgId/service-users/:serviceUserId/projects",
    {
      params: { orgId: Schema.String, serviceUserId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "restore",
    "/orgs/:orgId/service-users/:serviceUserId/restore",
    {
      params: { orgId: Schema.String, serviceUserId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setSubscription",
    "/orgs/:orgId/service-users/:serviceUserId/subscription",
    {
      params: { orgId: Schema.String, serviceUserId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
) {}
