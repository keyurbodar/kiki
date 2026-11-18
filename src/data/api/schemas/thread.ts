import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import {
  ActorId,
  EventId,
  JamId,
  ProjectId,
  PullRequestId,
  ThreadFolderId,
  ThreadTagId,
  Timestamp,
  UserId,
} from "./ids.ts";
import { ModelSelection } from "./organization.ts";

export const ThreadStatus = Schema.Literals([
  "working",
  "waiting",
  "idle",
  "failed",
  "archived",
]);
export type ThreadStatus = typeof ThreadStatus.Type;

export const ThreadOrigin = Schema.Literals([
  "web",
  "slack",
  "linear",
  "github",
  "api",
  "capy",
  "automation",
]);
export type ThreadOrigin = typeof ThreadOrigin.Type;

export const ThreadSection = Schema.Literals([
  "asks",
  "working",
  "recent",
  "settled",
]);

export const ActorKind = Schema.Literals(["human", "service"]);

export const PullState = Schema.Literals([
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
]);

export const ThreadSort = Schema.Literals(["lastActivity", "createdAt"]);

export class PullRequestChip extends Schema.Class<PullRequestChip>(
  "PullRequestChip",
)({
  id: PullRequestId,
  repo: Schema.String,
  number: Schema.Int,
  title: Schema.String,
  state: PullState,
  additions: Schema.Int,
  deletions: Schema.Int,
  diffBreakdown: Schema.NullOr(Schema.Unknown).pipe(withDefault(null)),
  author: Schema.String,
  authorAvatarUrl: Schema.String,
  url: Schema.String,
}) {}

export class ThreadCard extends Schema.Class<ThreadCard>("ThreadCard")({
  id: JamId,
  primaryMachine: Schema.optional(Schema.NullOr(Schema.Unknown)),
  title: Schema.NullOr(Schema.String),
  titleCustom: Schema.Boolean,
  status: ThreadStatus,
  archived: Schema.Boolean,
  archivedIdleDays: Schema.NullOr(Schema.Int).pipe(withDefault(null)),
  threadNumber: Schema.NullOr(Schema.Int),
  userId: ActorId,
  userType: ActorKind,
  takenFromUserId: Schema.NullOr(ActorId),
  takenFromUserType: Schema.NullOr(ActorKind),
  origin: ThreadOrigin,
  projectId: Schema.NullOr(ProjectId),
  slackChannel: Schema.NullOr(
    Schema.Struct({ id: Schema.String, name: Schema.NullOr(Schema.String) }),
  ),
  linearIssue: Schema.NullOr(Schema.Unknown).pipe(withDefault(null)),
  pinned: Schema.Boolean,
  settledAt: Schema.optional(Schema.NullOr(Timestamp)),
  section: Schema.optional(Schema.NullOr(ThreadSection)),
  member: Schema.Boolean,
  subscribed: Schema.Boolean.pipe(withDefault(false)),
  personal: Schema.Boolean.pipe(withDefault(false)),
  tagIds: Schema.Array(ThreadTagId),
  importing: Schema.Boolean,
  lastModelId: Schema.NullOr(Schema.String),
  pulls: Schema.Array(PullRequestChip),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActivityAt: Schema.NullOr(Timestamp),
  preview: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  sortActivityAt: Timestamp,
  hasUnreads: Schema.Boolean,
  mentionCount: Schema.Int,
  owed: Schema.Boolean.pipe(withDefault(false)),
  needsYou: Schema.Boolean.pipe(withDefault(false)),
  ask: Schema.NullOr(Schema.Unknown).pipe(withDefault(null)),
  crewNeedsYou: Schema.Int.pipe(withDefault(0)),
  participated: Schema.Boolean.pipe(withDefault(false)),
  crewMentionCount: Schema.Int.pipe(withDefault(0)),
  needsYouEventId: Schema.NullOr(EventId).pipe(withDefault(null)),
  captain: Schema.optional(Schema.Unknown),
  crewCount: Schema.optional(Schema.Int),
  automation: Schema.optional(Schema.Unknown),
}) {}

export class ThreadCardPage extends Schema.Class<ThreadCardPage>(
  "ThreadCardPage",
)({
  items: Schema.Array(ThreadCard),
  cursor: Schema.NullOr(Schema.String),
}) {}

export const ThreadPullState = Schema.Literals([
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
  "none",
]).annotate({ identifier: "ThreadPullState" });

export const ThreadRunStatus = Schema.Literals([
  "working",
  "waiting",
  "idle",
  "done",
  "failed",
]);

export const ThreadJoinPolicy = Schema.Literals(["anyone", "invite"]);

export const ThreadViewerRole = Schema.Literals(["owner", "member", "none"]);

export const ThreadTodo = Schema.Struct({
  content: Schema.String,
  status: Schema.Literals([
    "pending",
    "in_progress",
    "completed",
    "cancelled",
    "deferred",
  ]),
});

export class JamSlackLink extends Schema.Class<JamSlackLink>("JamSlackLink")({
  active: Schema.Boolean,
  channelId: Schema.String,
  threadTs: Schema.String,
  url: Schema.String,
}) {}

export class ThreadMember extends Schema.Class<ThreadMember>("ThreadMember")({
  userId: ActorId,
  invitedBy: Schema.NullOr(UserId),
  joinedAt: Timestamp,
  subscribed: Schema.Boolean.pipe(withDefault(true)),
}) {}

export class ThreadMembership extends Schema.Class<ThreadMembership>(
  "ThreadMembership",
)({
  joinPolicy: ThreadJoinPolicy,
  members: Schema.Array(ThreadMember),
  viewerRole: ThreadViewerRole,
  viewerSubscribed: Schema.Boolean.pipe(withDefault(false)),
}) {}

export const ViewerRequest = Schema.Struct({
  key: Schema.String,
  dismissed: Schema.Boolean,
}).annotate({ identifier: "ViewerRequest" });

export class JamDetail extends Schema.Class<JamDetail>("JamDetail")({
  ...ThreadCard.fields,
  parentJamId: Schema.NullOr(JamId),
  inheritedThroughEventId: Schema.NullOr(EventId),
  runStatus: ThreadRunStatus,
  wakePendingAt: Schema.NullOr(Timestamp).pipe(withDefault(null)),
  todos: Schema.Array(ThreadTodo),
  model: Schema.NullOr(ModelSelection),
  servedModel: Schema.NullOr(ModelSelection),
  servedModelEventId: Schema.NullOr(EventId),
  lastReadEventId: Schema.NullOr(EventId),
  slack: Schema.NullOr(JamSlackLink),
  membership: ThreadMembership,
  creditsContinue: Schema.optional(Schema.Boolean),
  requests: Schema.Array(ViewerRequest).pipe(withDefault([])),
}) {}

export class FolderCount extends Schema.Class<FolderCount>("FolderCount")({
  folderId: ThreadFolderId,
  count: Schema.Int,
}) {}

export class ThreadCounts extends Schema.Class<ThreadCounts>("ThreadCounts")({
  pinned: Schema.Int,
  folders: Schema.Array(FolderCount),
}) {}

export const JamBatchRequest = Schema.Struct({
  jamIds: Schema.Array(JamId),
}).annotate({ identifier: "JamBatchRequest" });

export const JamOutcome = Schema.Literals(["ok", "not_found"]).annotate({
  identifier: "JamOutcome",
});

export class JamBatchResult extends Schema.Class<JamBatchResult>(
  "JamBatchResult",
)({
  outcomes: Schema.Array(Schema.Struct({ jamId: JamId, outcome: JamOutcome })),
}) {}

export const PausedAutomation = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
}).annotate({ identifier: "PausedAutomation" });

export class JamArchiveResult extends Schema.Class<JamArchiveResult>(
  "JamArchiveResult",
)({
  outcomes: Schema.Array(
    Schema.Struct({
      jamId: JamId,
      outcome: JamOutcome,
      automation: Schema.optional(PausedAutomation),
    }),
  ),
}) {}

export const RenameJamRequest = Schema.Struct({
  title: Schema.NullOr(Schema.String),
}).annotate({ identifier: "RenameJamRequest" });

export class ThreadCollectionCard extends Schema.Class<ThreadCollectionCard>(
  "ThreadCollectionCard",
)({
  ...ThreadCard.fields,
  pulls: Schema.Array(PullRequestChip).check(Schema.isMaxLength(5)),
  pullCount: Schema.Int,
  pullStates: Schema.Array(
    Schema.Struct({ state: PullState, count: Schema.Int }),
  ),
}) {}
