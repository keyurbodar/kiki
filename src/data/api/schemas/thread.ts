import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import {
  ActorId,
  EventId,
  JamId,
  ProjectId,
  PullRequestId,
  ThreadTagId,
  Timestamp,
} from "./ids.ts";

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
