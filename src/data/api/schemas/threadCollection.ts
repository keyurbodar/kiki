import { Schema } from "effect";
import { ActorId, JamId, ProjectId, ThreadTagId, Timestamp } from "./ids.ts";
import {
  FolderCount,
  ThreadCollectionCard,
  ThreadOrigin,
  ThreadPullState,
  ThreadSection,
} from "./thread.ts";
import { ThreadFolder } from "./threadOrganization.ts";

export const ThreadGroupBy = Schema.Literals(["project", "author"]);

export const ThreadLiveStatus = Schema.Literals([
  "working",
  "waiting",
  "idle",
  "failed",
]);

export const ThreadFilterKind = Schema.Literals([
  "project",
  "origin",
  "author",
  "tag",
  "prState",
  "participant",
  "channel",
  "model",
  "created",
  "activity",
  "status",
]);

export const ThreadGroupRef = Schema.Struct({
  by: ThreadGroupBy,
  key: Schema.NullOr(Schema.String),
}).annotate({ identifier: "ThreadGroupRef" });

export const ThreadCollectionPageRequest = Schema.Struct({
  key: Schema.String,
  cursor: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Int),
  group: Schema.optional(ThreadGroupRef),
  section: Schema.optional(ThreadSection),
}).annotate({ identifier: "ThreadCollectionPageRequest" });

export const ThreadCollectionGroupsRequest = Schema.Struct({
  by: ThreadGroupBy,
  limit: Schema.optional(Schema.Int),
  section: Schema.optional(ThreadSection),
}).annotate({ identifier: "ThreadCollectionGroupsRequest" });

export const ThreadCollectionRequest = Schema.Struct({
  sort: Schema.optional(Schema.Literals(["activity", "createdAt"])),
  search: Schema.optional(Schema.String),
  projectIds: Schema.optional(Schema.Array(ProjectId)),
  origins: Schema.optional(Schema.Array(ThreadOrigin)),
  automationIds: Schema.optional(Schema.Array(Schema.String)),
  userIds: Schema.optional(Schema.Array(ActorId)),
  tagIds: Schema.optional(Schema.Array(ThreadTagId)),
  pullRequestStates: Schema.optional(Schema.Array(ThreadPullState)),
  participantIds: Schema.optional(Schema.Array(ActorId)),
  slackChannelIds: Schema.optional(Schema.Array(Schema.String)),
  modelIds: Schema.optional(Schema.Array(Schema.String)),
  captainIds: Schema.optional(Schema.Array(JamId)),
  statuses: Schema.optional(Schema.Array(ThreadLiveStatus)),
  createdAfter: Schema.optional(Timestamp),
  createdBefore: Schema.optional(Timestamp),
  activityAfter: Schema.optional(Timestamp),
  activityBefore: Schema.optional(Timestamp),
  exclude: Schema.optional(Schema.Array(ThreadFilterKind)),
  archived: Schema.optional(Schema.Literals(["exclude", "only"])),
  deleted: Schema.optional(Schema.Literals(["only"])),
  filed: Schema.optional(Schema.Literals(["exclude"])),
  pages: Schema.Array(ThreadCollectionPageRequest),
  groups: Schema.optional(ThreadCollectionGroupsRequest),
  counts: Schema.optional(Schema.Boolean),
  folders: Schema.optional(Schema.Boolean),
  channels: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "ThreadCollectionRequest" });

export class ThreadCollectionPage extends Schema.Class<ThreadCollectionPage>(
  "ThreadCollectionPage",
)({
  key: Schema.String,
  items: Schema.Array(ThreadCollectionCard),
  cursor: Schema.NullOr(Schema.String),
}) {}

export class ThreadCollectionGroup extends Schema.Class<ThreadCollectionGroup>(
  "ThreadCollectionGroup",
)({
  key: Schema.NullOr(Schema.String),
  count: Schema.Int,
  items: Schema.Array(ThreadCollectionCard),
  cursor: Schema.NullOr(Schema.String),
}) {}

export class ThreadCollectionCounts extends Schema.Class<ThreadCollectionCounts>(
  "ThreadCollectionCounts",
)({
  pinned: Schema.Int,
  folders: Schema.Array(FolderCount),
}) {}

export class ThreadCollectionFolderSection extends Schema.Class<ThreadCollectionFolderSection>(
  "ThreadCollectionFolderSection",
)({
  folder: ThreadFolder,
  items: Schema.Array(ThreadCollectionCard),
}) {}

export class ThreadChannelOption extends Schema.Class<ThreadChannelOption>(
  "ThreadChannelOption",
)({
  id: Schema.String,
  name: Schema.NullOr(Schema.String),
}) {}

export class ThreadCollectionResponse extends Schema.Class<ThreadCollectionResponse>(
  "ThreadCollectionResponse",
)({
  pages: Schema.Array(ThreadCollectionPage),
  groups: Schema.NullOr(Schema.Array(ThreadCollectionGroup)),
  counts: Schema.NullOr(ThreadCollectionCounts),
  folders: Schema.NullOr(Schema.Array(ThreadCollectionFolderSection)),
  channels: Schema.NullOr(Schema.Array(ThreadChannelOption)),
}) {}

export class FolderThreadsPage extends Schema.Class<FolderThreadsPage>(
  "FolderThreadsPage",
)({
  items: Schema.Array(ThreadCollectionCard),
  cursor: Schema.NullOr(Schema.String),
}) {}

export const ThreadCodeLookupRequest = Schema.Struct({
  codes: Schema.Array(Schema.String),
  projectId: Schema.optional(ProjectId),
}).annotate({ identifier: "ThreadCodeLookupRequest" });

export class ThreadCodeMatch extends Schema.Class<ThreadCodeMatch>(
  "ThreadCodeMatch",
)({
  code: Schema.String,
  card: ThreadCollectionCard,
  ambiguous: Schema.optional(Schema.Boolean),
}) {}
