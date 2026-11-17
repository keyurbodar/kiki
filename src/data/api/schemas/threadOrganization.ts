import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import {
  JamId,
  ProjectId,
  ThreadFolderId,
  ThreadTagId,
  Timestamp,
  UserId,
} from "./ids.ts";
import { ThreadCard } from "./thread.ts";

export const ThreadFolderSystemKind = Schema.Literals(["pinned"]);

export const ThreadFolderVisibility = Schema.Literals(["private", "shared"]);
export type ThreadFolderVisibility = typeof ThreadFolderVisibility.Type;

export const ThreadFolderSection = Schema.Literals(["threads", "captains"]);

export const FolderViewerRole = Schema.Literals([
  "owner",
  "member",
  "none",
]).annotate({ identifier: "FolderViewerRole" });

export const ThreadTagColor = Schema.Literals([
  "default",
  "primary",
  "success",
  "warning",
  "destructive",
  "blue",
  "purple",
  "pink",
  "orange",
  "lime",
]);
export type ThreadTagColor = typeof ThreadTagColor.Type;

export class ThreadFolderMember extends Schema.Class<ThreadFolderMember>(
  "ThreadFolderMember",
)({
  userId: UserId,
  createdAt: Timestamp,
}) {}

export class ThreadFolder extends Schema.Class<ThreadFolder>("ThreadFolder")({
  id: ThreadFolderId,
  systemKind: Schema.NullOr(ThreadFolderSystemKind),
  visibility: ThreadFolderVisibility,
  section: ThreadFolderSection.pipe(withDefault("threads")),
  ownerUserId: Schema.NullOr(UserId),
  name: Schema.NullOr(Schema.String),
  position: Schema.Int,
  hidden: Schema.Boolean,
  viewerRole: FolderViewerRole,
  members: Schema.Array(ThreadFolderMember),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class ThreadFolderItem extends Schema.Class<ThreadFolderItem>(
  "ThreadFolderItem",
)({
  folderId: ThreadFolderId,
  jamId: JamId,
  projectId: Schema.NullOr(ProjectId),
  position: Schema.Int,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class FolderBoardSection extends Schema.Class<FolderBoardSection>(
  "FolderBoardSection",
)({
  folder: ThreadFolder,
  items: Schema.Array(ThreadCard),
}) {}

export class ThreadTag extends Schema.Class<ThreadTag>("ThreadTag")({
  id: ThreadTagId,
  name: Schema.String,
  color: ThreadTagColor,
  deleted: Schema.Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class AssignedThreadTag extends Schema.Class<AssignedThreadTag>(
  "AssignedThreadTag",
)({
  id: ThreadTagId,
  name: Schema.String,
  color: ThreadTagColor,
}) {}

export const CreateFolderRequest = Schema.Struct({
  name: Schema.String,
  visibility: ThreadFolderVisibility,
  section: Schema.optional(ThreadFolderSection),
}).annotate({ identifier: "CreateFolderRequest" });

export const RenameFolderRequest = Schema.Struct({
  name: Schema.String,
}).annotate({ identifier: "RenameFolderRequest" });

export const ReorderFoldersRequest = Schema.Struct({
  folderIds: Schema.Array(ThreadFolderId),
}).annotate({ identifier: "ReorderFoldersRequest" });

export const SetFolderHiddenRequest = Schema.Struct({
  hidden: Schema.Boolean,
}).annotate({ identifier: "SetFolderHiddenRequest" });

export const ShareFolderRequest = Schema.Struct({
  userIds: Schema.Array(UserId),
}).annotate({ identifier: "ShareFolderRequest" });

export const UnshareFolderRequest = Schema.Struct({
  userIds: Schema.Array(UserId),
}).annotate({ identifier: "UnshareFolderRequest" });

export const SetFolderAccessRequest = Schema.Struct({
  visibility: ThreadFolderVisibility,
}).annotate({ identifier: "SetFolderAccessRequest" });

export const SetFolderOwnerRequest = Schema.Struct({
  userId: UserId,
}).annotate({ identifier: "SetFolderOwnerRequest" });

export const FolderItemOutcome = Schema.Literals([
  "ok",
  "not_found",
  "not_allowed",
]).annotate({ identifier: "FolderItemOutcome" });

export class FolderItemsResult extends Schema.Class<FolderItemsResult>(
  "FolderItemsResult",
)({
  items: Schema.Array(ThreadFolderItem),
  outcomes: Schema.Array(
    Schema.Struct({ jamId: JamId, outcome: FolderItemOutcome }),
  ),
}) {}

export const ReorderFolderItemsRequest = Schema.Struct({
  jamIds: Schema.Array(JamId),
}).annotate({ identifier: "ReorderFolderItemsRequest" });

export const CreateTagRequest = Schema.Struct({
  name: Schema.String,
  color: ThreadTagColor,
}).annotate({ identifier: "CreateTagRequest" });

export const UpdateTagRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  color: Schema.optional(ThreadTagColor),
}).annotate({ identifier: "UpdateTagRequest" });

export const TagAssignOutcome = Schema.Literals([
  "ok",
  "not_found",
  "limit",
]).annotate({ identifier: "TagAssignOutcome" });

export class TagAssignResult extends Schema.Class<TagAssignResult>(
  "TagAssignResult",
)({
  outcomes: Schema.Array(
    Schema.Struct({ jamId: JamId, outcome: TagAssignOutcome }),
  ),
}) {}
