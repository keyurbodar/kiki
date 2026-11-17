import { Schema } from "effect";
import { JamId, OrgId, ProjectId, Timestamp, UserId } from "./ids.ts";

export const VolumeId = Schema.String.check(
  Schema.isPattern(/^vol_[0-9A-Z]{26}$/u),
).pipe(Schema.brand("Core.VolumeId"));
export type VolumeId = typeof VolumeId.Type;

export const VolumeVersionId = Schema.String.check(
  Schema.isPattern(/^vver_[0-9A-Z]{26}$/u),
).pipe(Schema.brand("Core.VolumeVersionId"));
export type VolumeVersionId = typeof VolumeVersionId.Type;

export const DriveShareId = Schema.String.check(
  Schema.isPattern(/^dsh_[A-Za-z0-9_-]{24}$/u),
).pipe(Schema.brand("Core.DriveShareId"));
export type DriveShareId = typeof DriveShareId.Type;

export const AutomationId = Schema.String.pipe(
  Schema.brand("Core.AutomationId"),
);
export type AutomationId = typeof AutomationId.Type;

export const Sha256 = Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/u));

const Bytes = Schema.Number;

export const DriveStorageTier = Schema.Literals([
  "lite",
  "pro",
  "max",
  "enterprise",
  "scrapybara",
  "other",
]);

export const DriveStorage = Schema.Struct({
  usedBytes: Bytes,
  limitBytes: Bytes,
  tier: Schema.NullOr(DriveStorageTier),
});
export type DriveStorage = typeof DriveStorage.Type;

export const VolumeScope = Schema.Struct({
  projectId: Schema.optional(ProjectId),
  userId: Schema.optional(UserId),
  automationId: Schema.optional(AutomationId),
  captainJamId: Schema.optional(JamId),
}).annotate({ identifier: "VolumeScope" });
export type VolumeScope = typeof VolumeScope.Type;

export class Volume extends Schema.Class<Volume>("Volume")({
  id: VolumeId,
  namespace: Schema.String,
  name: Schema.String,
  projectId: Schema.NullOr(ProjectId),
  userId: Schema.NullOr(UserId),
  automationId: Schema.NullOr(AutomationId),
  captainJamId: Schema.NullOr(JamId),
  description: Schema.NullOr(Schema.String),
  archived: Schema.Boolean,
  headVersionId: Schema.NullOr(VolumeVersionId),
  headDigest: Schema.NullOr(Sha256),
  fileCount: Schema.Int,
  totalBytes: Bytes,
  headUpdatedAt: Schema.NullOr(Timestamp),
}) {}

export class VolumeScopeSummary extends Schema.Class<VolumeScopeSummary>(
  "VolumeScopeSummary",
)({
  projectId: Schema.NullOr(ProjectId),
  userId: Schema.NullOr(UserId),
  automationId: Schema.NullOr(AutomationId),
  captainJamId: Schema.NullOr(JamId),
  fileCount: Schema.Int,
  totalBytes: Bytes,
  headUpdatedAt: Schema.NullOr(Timestamp),
}) {}

export class VolumeScopeDirectory extends Schema.Class<VolumeScopeDirectory>(
  "VolumeScopeDirectory",
)({
  storage: DriveStorage,
  items: Schema.Array(VolumeScopeSummary),
  page: Schema.Int,
  pageCount: Schema.Int,
  totalScopes: Schema.Int,
}) {}

export class VolumeManifestEntry extends Schema.Class<VolumeManifestEntry>(
  "VolumeManifestEntry",
)({
  path: Schema.String,
  mode: Schema.Int,
  sizeBytes: Schema.Int,
  sha256: Sha256,
}) {}

export class VolumeManifest extends Schema.Class<VolumeManifest>(
  "VolumeManifest",
)({
  versionId: VolumeVersionId,
  volumeId: VolumeId,
  digest: Sha256,
  parentDigest: Schema.NullOr(Sha256),
  entries: Schema.Array(VolumeManifestEntry),
  fileCount: Schema.Int,
  totalBytes: Bytes,
}) {}

export class VolumeFolderEntry extends Schema.Class<VolumeFolderEntry>(
  "VolumeFolderEntry",
)({
  name: Schema.String,
  path: Schema.String,
  kind: Schema.Literals(["file", "folder"]),
  mode: Schema.Int,
  sizeBytes: Schema.Int,
  sha256: Schema.NullOr(Sha256),
}) {}

export class VolumeFolderPage extends Schema.Class<VolumeFolderPage>(
  "VolumeFolderPage",
)({
  versionId: VolumeVersionId,
  volumeId: VolumeId,
  digest: Sha256,
  dir: Schema.String,
  entries: Schema.Array(VolumeFolderEntry),
  next: Schema.NullOr(Schema.String),
  fileCount: Schema.Int,
  totalBytes: Bytes,
}) {}

export const VolumeTreeCursor = Schema.String.check(
  Schema.isPattern(/^[0-9a-f]{32}$/u),
);

export class VolumeTreePage extends Schema.Class<VolumeTreePage>(
  "VolumeTreePage",
)({
  entries: Schema.Array(VolumeManifestEntry),
  next: Schema.NullOr(VolumeTreeCursor),
}) {}

export class VolumeChange extends Schema.Class<VolumeChange>("VolumeChange")({
  path: Schema.String,
  change: Schema.Literals(["added", "modified", "deleted"]),
  sha256: Schema.NullOr(Sha256),
  sizeBytes: Schema.Int,
  movedFrom: Schema.NullOr(Schema.String),
}) {}

export class VolumeVersionChanges extends Schema.Class<VolumeVersionChanges>(
  "VolumeVersionChanges",
)({
  versionId: VolumeVersionId,
  volumeId: VolumeId,
  complete: Schema.Boolean,
  changes: Schema.Array(VolumeChange),
}) {}

export const DrivePurgeNameRequest = Schema.Struct({
  path: Schema.String.check(Schema.isBetweenLength(1, 4096)),
}).annotate({ identifier: "DrivePurgeNameRequest" });

export class DrivePurgeNameResult extends Schema.Class<DrivePurgeNameResult>(
  "DrivePurgeNameResult",
)({
  volumeId: VolumeId,
  deleted: Schema.Int,
  tombstoneFloor: Schema.Int,
}) {}

export class VolumeVersionRow extends Schema.Class<VolumeVersionRow>(
  "VolumeVersionRow",
)({
  id: VolumeVersionId,
  volumeId: VolumeId,
  kind: Schema.Literals(["autosave", "checkpoint"]),
  fileCount: Schema.Int,
  totalBytes: Bytes,
  createdAt: Timestamp,
  threadId: Schema.NullOr(JamId),
  threadTitle: Schema.NullOr(Schema.String),
  authorName: Schema.NullOr(Schema.String),
}) {}

export class VolumeFileRemoval extends Schema.Class<VolumeFileRemoval>(
  "VolumeFileRemoval",
)({
  versionId: VolumeVersionId,
  createdAt: Timestamp,
  threadTitle: Schema.NullOr(Schema.String),
  authorName: Schema.NullOr(Schema.String),
}) {}

export class VolumeFileVersion extends Schema.Class<VolumeFileVersion>(
  "VolumeFileVersion",
)({
  versionId: VolumeVersionId,
  sha256: Sha256,
  sizeBytes: Bytes,
  createdAt: Timestamp,
  threadTitle: Schema.NullOr(Schema.String),
  authorName: Schema.NullOr(Schema.String),
  removedBy: Schema.optional(VolumeFileRemoval),
}) {}

export class VolumeFileContent extends Schema.Class<VolumeFileContent>(
  "VolumeFileContent",
)({
  type: Schema.Literal("content"),
  content: Schema.String,
}) {}

export class VolumeFileUrl extends Schema.Class<VolumeFileUrl>("VolumeFileUrl")(
  {
    type: Schema.Literal("url"),
    url: Schema.String,
    expiresAt: Timestamp,
  },
) {}

export const VolumeFile = Schema.Union([
  VolumeFileContent,
  VolumeFileUrl,
]).annotate({ identifier: "VolumeFile" });
export type VolumeFile = typeof VolumeFile.Type;

export const DriveShareVisibility = Schema.Literals([
  "private",
  "org",
  "public",
]).annotate({ identifier: "DriveShareVisibility" });
export type DriveShareVisibility = typeof DriveShareVisibility.Type;

const driveShareFields = {
  id: DriveShareId,
  volumeId: VolumeId,
  path: Schema.String,
  visibility: DriveShareVisibility,
  url: Schema.String,
  createdBy: Schema.NullOr(Schema.String),
  manageable: Schema.Boolean,
  createdAt: Timestamp,
};

export class DriveShare extends Schema.Class<DriveShare>("DriveShare")(
  driveShareFields,
) {}

export class DriveShareListing extends Schema.Class<DriveShareListing>(
  "DriveShareListing",
)({
  ...driveShareFields,
  projectId: Schema.NullOr(ProjectId),
  userId: Schema.NullOr(UserId),
  automationId: Schema.NullOr(AutomationId),
  captainJamId: Schema.NullOr(JamId),
  changedAt: Schema.NullOr(Timestamp),
}) {}

export class DriveShareDirectory extends Schema.Class<DriveShareDirectory>(
  "DriveShareDirectory",
)({
  items: Schema.Array(DriveShareListing),
  page: Schema.Int,
  pageCount: Schema.Int,
  total: Schema.Int,
}) {}

export const DriveShareMember = Schema.Struct({
  orgId: OrgId,
  manageable: Schema.Boolean,
  projectId: Schema.NullOr(ProjectId),
  userId: Schema.NullOr(UserId),
  automationId: Schema.NullOr(AutomationId),
  captainJamId: Schema.NullOr(JamId),
}).annotate({ identifier: "DriveShareMember" });

export class DriveShareView extends Schema.Class<DriveShareView>(
  "DriveShareView",
)({
  type: Schema.Literal("file"),
  id: DriveShareId,
  path: Schema.String,
  visibility: DriveShareVisibility,
  url: Schema.String,
  orgName: Schema.String,
  authorName: Schema.NullOr(Schema.String),
  member: Schema.NullOr(DriveShareMember),
  versionId: VolumeVersionId,
  versionCreatedAt: Timestamp,
  sizeBytes: Bytes,
  file: VolumeFile,
}) {}

export class DriveShareRestricted extends Schema.Class<DriveShareRestricted>(
  "DriveShareRestricted",
)({
  type: Schema.Literal("restricted"),
}) {}

export const DriveShareRead = Schema.Union([
  DriveShareView,
  DriveShareRestricted,
]).annotate({ identifier: "DriveShareRead" });
export type DriveShareRead = typeof DriveShareRead.Type;

export const CreateDriveShareRequest = Schema.Struct({
  path: Schema.String.check(Schema.isBetweenLength(1, 4096)),
}).annotate({ identifier: "CreateDriveShareRequest" });

export const UpdateDriveShareRequest = Schema.Struct({
  visibility: DriveShareVisibility,
}).annotate({ identifier: "UpdateDriveShareRequest" });

export class VolumeSkill extends Schema.Class<VolumeSkill>("VolumeSkill")({
  name: Schema.String,
  description: Schema.String,
}) {}

export const VolumeWriteMode = Schema.Literals([420, 493]);

export const VolumeWriteChange = Schema.Union([
  Schema.Struct({ path: Schema.String, content: Schema.String }),
  Schema.Struct({
    path: Schema.String,
    contentBase64: Schema.String,
    mode: Schema.optional(VolumeWriteMode),
  }),
  Schema.Struct({ path: Schema.String, delete: Schema.Literal(true) }),
]);
export type VolumeWriteChange = typeof VolumeWriteChange.Type;

export const VolumeWriteRequest = Schema.Struct({
  scope: VolumeScope,
  expectedDigest: Schema.NullOr(Sha256),
  changes: Schema.Array(VolumeWriteChange),
}).annotate({ identifier: "VolumeWriteRequest" });
export type VolumeWriteRequest = typeof VolumeWriteRequest.Type;

export const VolumeRestoreRequest = Schema.Struct({
  versionId: VolumeVersionId,
  expectedDigest: Sha256,
}).annotate({ identifier: "VolumeRestoreRequest" });

export class VolumeNotFound extends Schema.TaggedError<VolumeNotFound>()(
  "capy/VolumeNotFound",
  { volumeId: VolumeId },
  { httpApiStatus: 404 },
) {}

export class VolumeVersionNotFound extends Schema.TaggedError<VolumeVersionNotFound>()(
  "capy/VolumeVersionNotFound",
  { volumeId: VolumeId, versionId: VolumeVersionId },
  { httpApiStatus: 404 },
) {}

export class VolumeFileNotFound extends Schema.TaggedError<VolumeFileNotFound>()(
  "capy/VolumeFileNotFound",
  { volumeId: VolumeId, sha256: Sha256 },
  { httpApiStatus: 404 },
) {}

export class DriveShareNotFound extends Schema.TaggedError<DriveShareNotFound>()(
  "capy/DriveShareNotFound",
  { shareId: DriveShareId },
  { httpApiStatus: 404 },
) {}

export class DriveSharePathNotFound extends Schema.TaggedError<DriveSharePathNotFound>()(
  "capy/DriveSharePathNotFound",
  { volumeId: VolumeId, path: Schema.String },
  { httpApiStatus: 404 },
) {}

export class VolumeHeadMoved extends Schema.TaggedError<VolumeHeadMoved>()(
  "capy/VolumeHeadMoved",
  {
    volumeId: VolumeId,
    headDigest: Schema.NullOr(Sha256),
    paths: Schema.Array(Schema.String),
  },
  { httpApiStatus: 409 },
) {}

export class VolumeWriteRejected extends Schema.TaggedError<VolumeWriteRejected>()(
  "capy/VolumeWriteRejected",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class DriveFull extends Schema.TaggedError<DriveFull>()(
  "capy/DriveFull",
  DriveStorage.fields,
  { httpApiStatus: 507 },
) {}
