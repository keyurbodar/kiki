import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  AutomationId,
  CreateDriveShareRequest,
  DriveFull,
  DrivePurgeNameRequest,
  DrivePurgeNameResult,
  DriveShare,
  DriveShareDirectory,
  DriveShareId,
  DriveShareNotFound,
  DriveSharePathNotFound,
  DriveShareRead,
  DriveShareView,
  Sha256,
  UpdateDriveShareRequest,
  Volume,
  VolumeFile,
  VolumeFileNotFound,
  VolumeFileVersion,
  VolumeFolderPage,
  VolumeHeadMoved,
  VolumeId,
  VolumeManifest,
  VolumeNotFound,
  VolumeRestoreRequest,
  VolumeScopeDirectory,
  VolumeSkill,
  VolumeTreeCursor,
  VolumeTreePage,
  VolumeVersionChanges,
  VolumeVersionId,
  VolumeVersionNotFound,
  VolumeVersionRow,
  VolumeWriteRejected,
  VolumeWriteRequest,
} from "../schemas/drive.ts";
import { Forbidden } from "../schemas/errors.ts";
import { JamId, OrgId, ProjectId, UserId } from "../schemas/ids.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

const DrivePath = Schema.String.check(Schema.isBetweenLength(1, 4096));

export class VolumesGroup extends HttpApiGroup.make("volumes").add(
  HttpApiEndpoint.get("readShare", "/me/drive-shares/:shareId", {
    params: { shareId: DriveShareId },
    success: DriveShareView,
    error: [DriveShareNotFound, Forbidden],
  }),
  HttpApiEndpoint.get(
    "agentContextPreview",
    "/orgs/:orgId/agent-context/preview",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("list", "/orgs/:orgId/drive", {
    params: { orgId: OrgId },
    query: {
      projectId: Schema.optional(ProjectId),
      userId: Schema.optional(UserId),
      automationId: Schema.optional(AutomationId),
      captainJamId: Schema.optional(JamId),
      exactScope: Schema.optional(Schema.Literal("true")),
      archived: Schema.optional(Schema.Literals(["true", "false"])),
    },
    success: Schema.Array(Volume),
    error: Forbidden,
  }),
  HttpApiEndpoint.get("scopeDirectory", "/orgs/:orgId/drive-scopes", {
    params: { orgId: OrgId },
    query: {
      projectId: Schema.optional(ProjectId),
      automationId: Schema.optional(AutomationId),
      page: Schema.optional(Schema.NumberFromString),
    },
    success: VolumeScopeDirectory,
    error: Forbidden,
  }),
  HttpApiEndpoint.post("write", "/orgs/:orgId/drive-scopes/write", {
    params: { orgId: OrgId },
    payload: VolumeWriteRequest,
    success: VolumeManifest,
    error: [Forbidden, VolumeHeadMoved, VolumeWriteRejected, DriveFull],
  }),
  HttpApiEndpoint.get("listOrgShares", "/orgs/:orgId/drive-shares", {
    params: { orgId: OrgId },
    query: { page: Schema.optional(Schema.NumberFromString) },
    success: DriveShareDirectory,
    error: Forbidden,
  }),
  HttpApiEndpoint.patch("updateShare", "/orgs/:orgId/drive-shares/:shareId", {
    params: { orgId: OrgId, shareId: DriveShareId },
    payload: UpdateDriveShareRequest,
    success: DriveShare,
    error: [DriveShareNotFound, Forbidden],
  }),
  HttpApiEndpoint.delete("revokeShare", "/orgs/:orgId/drive-shares/:shareId", {
    params: { orgId: OrgId, shareId: DriveShareId },
    success: Schema.Void,
    error: [DriveShareNotFound, Forbidden],
  }),
  HttpApiEndpoint.get("skills", "/orgs/:orgId/drive-skills", {
    params: { orgId: OrgId },
    query: {
      projectId: Schema.optional(ProjectId),
      threadId: Schema.optional(JamId),
    },
    success: Schema.Array(VolumeSkill),
    error: Forbidden,
  }),
  HttpApiEndpoint.post("archive", "/orgs/:orgId/drive/:volumeId/archive", {
    params: { orgId: OrgId, volumeId: VolumeId },
    success: Volume,
    error: VolumeNotFound,
  }),
  HttpApiEndpoint.get(
    "fileVersions",
    "/orgs/:orgId/drive/:volumeId/file-versions",
    {
      params: { orgId: OrgId, volumeId: VolumeId },
      query: { path: DrivePath, before: Schema.optional(VolumeVersionId) },
      success: Schema.Array(VolumeFileVersion),
      error: VolumeNotFound,
    },
  ),
  HttpApiEndpoint.post("purgeName", "/orgs/:orgId/drive/:volumeId/purge-name", {
    params: { orgId: OrgId, volumeId: VolumeId },
    payload: DrivePurgeNameRequest,
    success: DrivePurgeNameResult,
    error: [VolumeNotFound, Forbidden],
  }),
  HttpApiEndpoint.post("restore", "/orgs/:orgId/drive/:volumeId/restore", {
    params: { orgId: OrgId, volumeId: VolumeId },
    payload: VolumeRestoreRequest,
    success: VolumeManifest,
    error: [
      Forbidden,
      VolumeNotFound,
      VolumeVersionNotFound,
      VolumeHeadMoved,
      VolumeWriteRejected,
      DriveFull,
    ],
  }),
  HttpApiEndpoint.get("listShares", "/orgs/:orgId/drive/:volumeId/shares", {
    params: { orgId: OrgId, volumeId: VolumeId },
    success: Schema.Array(DriveShare),
    error: VolumeNotFound,
  }),
  HttpApiEndpoint.post("createShare", "/orgs/:orgId/drive/:volumeId/shares", {
    params: { orgId: OrgId, volumeId: VolumeId },
    payload: CreateDriveShareRequest,
    success: DriveShare,
    error: [
      VolumeNotFound,
      DriveSharePathNotFound,
      DriveShareNotFound,
      Forbidden,
    ],
  }),
  HttpApiEndpoint.post("unarchive", "/orgs/:orgId/drive/:volumeId/unarchive", {
    params: { orgId: OrgId, volumeId: VolumeId },
    success: Volume,
    error: VolumeNotFound,
  }),
  HttpApiEndpoint.get("versions", "/orgs/:orgId/drive/:volumeId/versions", {
    params: { orgId: OrgId, volumeId: VolumeId },
    success: Schema.Array(VolumeVersionRow),
    error: VolumeNotFound,
  }),
  HttpApiEndpoint.get(
    "manifest",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId",
    {
      params: { orgId: OrgId, volumeId: VolumeId, versionId: VolumeVersionId },
      query: {
        dir: Schema.optional(Schema.String),
        after: Schema.optional(DrivePath),
      },
      success: Schema.Union([VolumeManifest, VolumeFolderPage]),
      error: [VolumeNotFound, VolumeVersionNotFound],
    },
  ),
  HttpApiEndpoint.get(
    "changes",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/changes",
    {
      params: { orgId: OrgId, volumeId: VolumeId, versionId: VolumeVersionId },
      success: VolumeVersionChanges,
      error: [VolumeNotFound, VolumeVersionNotFound],
    },
  ),
  HttpApiEndpoint.get(
    "file",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/files/:sha256",
    {
      params: {
        orgId: OrgId,
        volumeId: VolumeId,
        versionId: VolumeVersionId,
        sha256: Sha256,
      },
      success: VolumeFile,
      error: [VolumeNotFound, VolumeVersionNotFound, VolumeFileNotFound],
    },
  ),
  HttpApiEndpoint.get(
    "tree",
    "/orgs/:orgId/drive/:volumeId/versions/:versionId/tree",
    {
      params: { orgId: OrgId, volumeId: VolumeId, versionId: VolumeVersionId },
      query: { after: Schema.optional(VolumeTreeCursor) },
      success: VolumeTreePage,
      error: [VolumeNotFound, VolumeVersionNotFound],
    },
  ),
  HttpApiEndpoint.get("publicShare", "/share/:shareId", {
    params: { shareId: DriveShareId },
    success: DriveShareRead,
    error: DriveShareNotFound,
  }),
) {}
