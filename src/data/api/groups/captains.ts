import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { CaptainCard, CaptainListScope } from "../schemas/captain.ts";
import { Forbidden } from "../schemas/errors.ts";
import { OrgId } from "../schemas/ids.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class CaptainsGroup extends HttpApiGroup.make("captains").add(
  HttpApiEndpoint.post("uploadImage", "/orgs/:orgId/captain-images", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listLibrary", "/orgs/:orgId/captain-library", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("uploadLibraryImage", "/orgs/:orgId/captain-library", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "removeLibraryImage",
    "/orgs/:orgId/captain-library/:imageId",
    {
      params: { orgId: Schema.String, imageId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("list", "/orgs/:orgId/captains", {
    params: { orgId: OrgId },
    query: { scope: Schema.optional(CaptainListScope) },
    success: Schema.Array(CaptainCard),
    error: Forbidden,
  }),
  HttpApiEndpoint.post("create", "/orgs/:orgId/captains", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId/captains/:jamId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("update", "/orgs/:orgId/captains/:jamId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("delete", "/orgs/:orgId/captains/:jamId", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setCaptainAccess",
    "/orgs/:orgId/captains/:jamId/access",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("crew", "/orgs/:orgId/captains/:jamId/crew", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("joinCrew", "/orgs/:orgId/captains/:jamId/crew", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "leaveCrew",
    "/orgs/:orgId/captains/:jamId/crew/:threadId",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        threadId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "moveCrew",
    "/orgs/:orgId/captains/:jamId/crew/:threadId/move",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        threadId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("demote", "/orgs/:orgId/captains/:jamId/demote", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setCaptainHidden",
    "/orgs/:orgId/captains/:jamId/hidden",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("leaveCaptain", "/orgs/:orgId/captains/:jamId/leave", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "addCaptainMembers",
    "/orgs/:orgId/captains/:jamId/members",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeCaptainMembers",
    "/orgs/:orgId/captains/:jamId/members",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, jamId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setCaptainOwner", "/orgs/:orgId/captains/:jamId/owner", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "promoteFolder",
    "/orgs/:orgId/captains/promote-folder",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "promoteThread",
    "/orgs/:orgId/captains/promote-thread",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
) {}
