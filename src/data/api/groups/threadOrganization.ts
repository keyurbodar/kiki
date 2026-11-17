import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  Forbidden,
  InvalidRequest,
  ThreadOrganizationNotFound,
} from "../schemas/errors.ts";
import { JamId, OrgId, ThreadFolderId, ThreadTagId } from "../schemas/ids.ts";
import { JamBatchRequest, JamBatchResult } from "../schemas/thread.ts";
import {
  AssignedThreadTag,
  CreateFolderRequest,
  CreateTagRequest,
  FolderBoardSection,
  FolderItemsResult,
  RenameFolderRequest,
  ReorderFolderItemsRequest,
  ReorderFoldersRequest,
  SetFolderAccessRequest,
  SetFolderHiddenRequest,
  SetFolderOwnerRequest,
  ShareFolderRequest,
  TagAssignResult,
  ThreadFolder,
  ThreadFolderItem,
  ThreadTag,
  UnshareFolderRequest,
  UpdateTagRequest,
} from "../schemas/threadOrganization.ts";

const error = [ThreadOrganizationNotFound, InvalidRequest, Forbidden];
const folderParams = { orgId: OrgId, folderId: ThreadFolderId };
const tagParams = { orgId: OrgId, tagId: ThreadTagId };

export class ThreadOrganizationGroup extends HttpApiGroup.make(
  "threadOrganization",
).add(
  HttpApiEndpoint.get("manifest", "/orgs/:orgId/folders", {
    params: { orgId: OrgId },
    success: Schema.Array(ThreadFolder),
    error,
  }),
  HttpApiEndpoint.post("createFolder", "/orgs/:orgId/folders", {
    params: { orgId: OrgId },
    payload: CreateFolderRequest,
    success: ThreadFolder,
    error,
  }),
  HttpApiEndpoint.patch("renameFolder", "/orgs/:orgId/folders/:folderId", {
    params: folderParams,
    payload: RenameFolderRequest,
    success: ThreadFolder,
    error,
  }),
  HttpApiEndpoint.put("reorderFolders", "/orgs/:orgId/folders/reorder", {
    params: { orgId: OrgId },
    payload: ReorderFoldersRequest,
    success: Schema.Array(ThreadFolder),
    error,
  }),
  HttpApiEndpoint.put(
    "setFolderHidden",
    "/orgs/:orgId/folders/:folderId/hidden",
    {
      params: folderParams,
      payload: SetFolderHiddenRequest,
      success: ThreadFolder,
      error,
    },
  ),
  HttpApiEndpoint.post(
    "shareFolder",
    "/orgs/:orgId/folders/:folderId/members",
    {
      params: folderParams,
      payload: ShareFolderRequest,
      success: ThreadFolder,
      error,
    },
  ),
  HttpApiEndpoint.delete(
    "unshareFolder",
    "/orgs/:orgId/folders/:folderId/members",
    {
      params: folderParams,
      payload: UnshareFolderRequest,
      success: ThreadFolder,
      error,
    },
  ),
  HttpApiEndpoint.post("leaveFolder", "/orgs/:orgId/folders/:folderId/leave", {
    params: folderParams,
    error,
  }),
  HttpApiEndpoint.put(
    "setFolderAccess",
    "/orgs/:orgId/folders/:folderId/access",
    {
      params: folderParams,
      payload: SetFolderAccessRequest,
      success: ThreadFolder,
      error,
    },
  ),
  HttpApiEndpoint.put(
    "setFolderOwner",
    "/orgs/:orgId/folders/:folderId/owner",
    {
      params: folderParams,
      payload: SetFolderOwnerRequest,
      success: ThreadFolder,
      error,
    },
  ),
  HttpApiEndpoint.delete("deleteFolder", "/orgs/:orgId/folders/:folderId", {
    params: folderParams,
    error,
  }),
  HttpApiEndpoint.get("board", "/orgs/:orgId/folders/board", {
    params: { orgId: OrgId },
    success: Schema.Array(FolderBoardSection),
    error,
  }),
  HttpApiEndpoint.post("addToFolder", "/orgs/:orgId/folders/:folderId/items", {
    params: folderParams,
    payload: JamBatchRequest,
    success: FolderItemsResult,
    error,
  }),
  HttpApiEndpoint.delete(
    "removeFromFolder",
    "/orgs/:orgId/folders/:folderId/items",
    {
      params: folderParams,
      payload: JamBatchRequest,
      success: FolderItemsResult,
      error,
    },
  ),
  HttpApiEndpoint.put(
    "reorderFolderItems",
    "/orgs/:orgId/folders/:folderId/items/reorder",
    {
      params: folderParams,
      payload: ReorderFolderItemsRequest,
      success: Schema.Array(ThreadFolderItem),
      error,
    },
  ),
  HttpApiEndpoint.post("pin", "/orgs/:orgId/jams/pin", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamBatchResult,
    error,
  }),
  HttpApiEndpoint.post("unpin", "/orgs/:orgId/jams/unpin", {
    params: { orgId: OrgId },
    payload: JamBatchRequest,
    success: JamBatchResult,
    error,
  }),
  HttpApiEndpoint.get("listTags", "/orgs/:orgId/tags", {
    params: { orgId: OrgId },
    query: { deleted: Schema.optional(Schema.Literals(["true", "false"])) },
    success: Schema.Array(ThreadTag),
    error,
  }),
  HttpApiEndpoint.post("createTag", "/orgs/:orgId/tags", {
    params: { orgId: OrgId },
    payload: CreateTagRequest,
    success: ThreadTag,
    error,
  }),
  HttpApiEndpoint.patch("updateTag", "/orgs/:orgId/tags/:tagId", {
    params: tagParams,
    payload: UpdateTagRequest,
    success: ThreadTag,
    error,
  }),
  HttpApiEndpoint.delete("deleteTag", "/orgs/:orgId/tags/:tagId", {
    params: tagParams,
    error,
  }),
  HttpApiEndpoint.post("restoreTag", "/orgs/:orgId/tags/:tagId/restore", {
    params: tagParams,
    success: ThreadTag,
    error,
  }),
  HttpApiEndpoint.get("tagsForThread", "/orgs/:orgId/jams/:jamId/tags", {
    params: { orgId: OrgId, jamId: JamId },
    success: Schema.Array(AssignedThreadTag),
    error,
  }),
  HttpApiEndpoint.put("assignTag", "/orgs/:orgId/jams/tags/:tagId", {
    params: tagParams,
    payload: JamBatchRequest,
    success: TagAssignResult,
    error,
  }),
  HttpApiEndpoint.delete("unassignTag", "/orgs/:orgId/jams/tags/:tagId", {
    params: tagParams,
    payload: JamBatchRequest,
    success: JamBatchResult,
    error,
  }),
) {}
