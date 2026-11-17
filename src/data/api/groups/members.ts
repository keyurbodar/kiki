import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class MembersGroup extends HttpApiGroup.make("members").add(
  HttpApiEndpoint.get("listMembers", "/orgs/:orgId/members", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "grantOwner",
    "/orgs/:orgId/members/:userId/grant-owner",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setMemberMfaExtension",
    "/orgs/:orgId/members/:userId/mfa-extension",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "clearMemberMfaExtension",
    "/orgs/:orgId/members/:userId/mfa-extension",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("removeMember", "/orgs/:orgId/members/:userId/remove", {
    params: { orgId: Schema.String, userId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "restoreMember",
    "/orgs/:orgId/members/:userId/restore",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "revokeOwner",
    "/orgs/:orgId/members/:userId/revoke-owner",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setMemberRole", "/orgs/:orgId/members/:userId/role", {
    params: { orgId: Schema.String, userId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("invite", "/orgs/:orgId/members/invite", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
