import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ThreadOrganizationGroup extends HttpApiGroup.make(
  "threadOrganization",
).add(
  HttpApiEndpoint.get("manifest", "/orgs/:orgId/folders", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createFolder", "/orgs/:orgId/folders", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("renameFolder", "/orgs/:orgId/folders/:folderId", {
    params: { orgId: Schema.String, folderId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("deleteFolder", "/orgs/:orgId/folders/:folderId", {
    params: { orgId: Schema.String, folderId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setFolderAccess",
    "/orgs/:orgId/folders/:folderId/access",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setFolderHidden",
    "/orgs/:orgId/folders/:folderId/hidden",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("addToFolder", "/orgs/:orgId/folders/:folderId/items", {
    params: { orgId: Schema.String, folderId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "removeFromFolder",
    "/orgs/:orgId/folders/:folderId/items",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "reorderFolderItems",
    "/orgs/:orgId/folders/:folderId/items/reorder",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("leaveFolder", "/orgs/:orgId/folders/:folderId/leave", {
    params: { orgId: Schema.String, folderId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "shareFolder",
    "/orgs/:orgId/folders/:folderId/members",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "unshareFolder",
    "/orgs/:orgId/folders/:folderId/members",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setFolderOwner",
    "/orgs/:orgId/folders/:folderId/owner",
    {
      params: { orgId: Schema.String, folderId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("board", "/orgs/:orgId/folders/board", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("reorderFolders", "/orgs/:orgId/folders/reorder", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("tagsForThread", "/orgs/:orgId/jams/:jamId/tags", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("pin", "/orgs/:orgId/jams/pin", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("assignTag", "/orgs/:orgId/jams/tags/:tagId", {
    params: { orgId: Schema.String, tagId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("unassignTag", "/orgs/:orgId/jams/tags/:tagId", {
    params: { orgId: Schema.String, tagId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("unpin", "/orgs/:orgId/jams/unpin", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listTags", "/orgs/:orgId/tags", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createTag", "/orgs/:orgId/tags", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateTag", "/orgs/:orgId/tags/:tagId", {
    params: { orgId: Schema.String, tagId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("deleteTag", "/orgs/:orgId/tags/:tagId", {
    params: { orgId: Schema.String, tagId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("restoreTag", "/orgs/:orgId/tags/:tagId/restore", {
    params: { orgId: Schema.String, tagId: Schema.String },
    success: Undecoded,
  }),
) {}
