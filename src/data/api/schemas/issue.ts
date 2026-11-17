import { Schema } from "effect";
import { FileId } from "./files.ts";
import {
  IssueCommentId,
  IssueEventId,
  IssueId,
  IssueLabelId,
  IssueStateId,
  JamId,
  ProjectId,
  PullRequestId,
  Timestamp,
  UserId,
} from "./ids.ts";
import { ThreadStatus } from "./thread.ts";

export const issueStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "canceled",
] as const;
export const IssueStatus = Schema.Literals(issueStatuses);
export type IssueStatus = typeof IssueStatus.Type;

export const closedIssueStatuses: ReadonlyArray<IssueStatus> = [
  "done",
  "canceled",
];
export const isClosedIssueStatus = (status: IssueStatus) =>
  closedIssueStatuses.includes(status);

export const IssueStateType = Schema.Literals(["open", "closed"]);
export type IssueStateType = typeof IssueStateType.Type;

export const issueStateIcons = [
  "dashed",
  "empty",
  "half",
  "progress",
  "check",
  "x",
  "clock",
  "hourglass",
  "snooze",
  "calendar",
  "pause",
  "hand",
  "stop",
  "chat",
  "question",
  "external",
  "sleep",
  "eye",
  "testtube",
  "search",
  "shield",
  "approved",
  "pull",
  "clipboard",
  "code",
  "rocket",
  "box",
  "package",
  "flag",
  "upload",
  "shipping",
  "truck",
  "parachute",
  "bug",
  "inbox",
  "fire",
  "warning",
  "alert",
  "siren",
  "unknown",
  "idea",
  "circlecheck",
  "checkmark",
  "inboxdone",
  "trophy",
  "archive",
  "minus",
  "ban",
  "duplicate",
] as const;
export const IssueStateIcon = Schema.Literals(issueStateIcons);
export type IssueStateIcon = typeof IssueStateIcon.Type;

export const issueColors = [
  "gray",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
] as const;
export const IssueColor = Schema.Literals(issueColors);
export type IssueColor = typeof IssueColor.Type;

export const issuePriorities = ["urgent", "high", "normal", "low"] as const;
export const IssuePriority = Schema.Literals(issuePriorities);
export type IssuePriority = typeof IssuePriority.Type;

export const IssueVisibility = Schema.Literals(["org", "private"]);
export type IssueVisibility = typeof IssueVisibility.Type;

export const IssueDueDate = Schema.String.check(
  Schema.makeFilter((value: string) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        value >= "1000-01-01" &&
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value) ||
      "A due date must be a real calendar date as YYYY-MM-DD"
    );
  }),
);
export type IssueDueDate = typeof IssueDueDate.Type;

export const issueRelationKinds = ["blocked_by", "blocks", "related"] as const;
export const IssueRelationKind = Schema.Literals(issueRelationKinds);
export type IssueRelationKind = typeof IssueRelationKind.Type;

export const IssuePullState = Schema.Literals([
  "open",
  "draft",
  "merged",
  "closed",
]);
export type IssuePullState = typeof IssuePullState.Type;

export const IssueEventKind = Schema.Literals([
  "created",
  "status_changed",
  "priority_changed",
  "assignee_changed",
  "title_changed",
  "description_edited",
  "parent_set",
  "sub_issue_added",
  "sub_issue_removed",
  "linked",
  "unlinked",
  "visibility_changed",
  "state_changed",
]);
export type IssueEventKind = typeof IssueEventKind.Type;

export class IssueActor extends Schema.Class<IssueActor>("IssueActor")({
  kind: Schema.Literals(["user", "jam"]),
  id: Schema.String,
  name: Schema.String,
  code: Schema.NullOr(Schema.String),
  avatarUrl: Schema.NullOr(Schema.String),
  captain: Schema.Boolean,
  status: Schema.optionalKey(ThreadStatus),
  hidden: Schema.optionalKey(Schema.Boolean),
}) {}

export class IssueViewer extends Schema.Class<IssueViewer>("IssueViewer")({
  subscribed: Schema.Boolean,
  unread: Schema.Boolean,
  unreadSince: Schema.NullOr(Timestamp),
  mentions: Schema.Int,
}) {}

export class IssueRelationRef extends Schema.Class<IssueRelationRef>(
  "IssueRelationRef",
)({
  code: Schema.String,
  number: Schema.Int,
  title: Schema.String,
  status: IssueStatus,
  stateId: IssueStateId,
}) {}

export class IssueLabel extends Schema.Class<IssueLabel>("IssueLabel")({
  id: IssueLabelId,
  name: Schema.String,
  color: IssueColor,
}) {}

export class IssueLabelList extends Schema.Class<IssueLabelList>(
  "IssueLabelList",
)({ labels: Schema.Array(IssueLabel) }) {}

export class IssuePullRef extends Schema.Class<IssuePullRef>("IssuePullRef")({
  repoFullName: Schema.String,
  prNumber: Schema.Int,
  title: Schema.String,
  state: IssuePullState,
}) {}

export class IssueSummary extends Schema.Class<IssueSummary>("IssueSummary")({
  id: IssueId,
  code: Schema.String,
  number: Schema.Int,
  projectId: ProjectId,
  title: Schema.String,
  status: IssueStatus,
  stateId: IssueStateId,
  priority: IssuePriority,
  dueAt: Schema.optionalKey(IssueDueDate),
  parentIssueId: Schema.NullOr(IssueId),
  visibility: IssueVisibility,
  accessJamId: Schema.NullOr(JamId),
  assignee: Schema.NullOr(IssueActor),
  assignees: Schema.optionalKey(Schema.Array(IssueActor)),
  labels: Schema.optionalKey(Schema.Array(IssueLabel)),
  blockedBy: Schema.optionalKey(Schema.Array(IssueRelationRef)),
  blocking: Schema.optionalKey(Schema.Array(IssueRelationRef)),
  blockingCount: Schema.optionalKey(Schema.Int),
  subIssueCount: Schema.Int,
  closedSubIssueCount: Schema.Int,
  openBlockers: Schema.optionalKey(Schema.Int),
  pulls: Schema.optionalKey(Schema.Array(IssuePullRef)),
  viewer: IssueViewer,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  closedAt: Schema.NullOr(Timestamp),
}) {}

export class IssuePullLink extends Schema.Class<IssuePullLink>("IssuePullLink")(
  {
    pullId: PullRequestId,
    repoFullName: Schema.String,
    prNumber: Schema.Int,
    title: Schema.String,
    state: IssuePullState,
    viaCode: Schema.NullOr(Schema.String),
    openedAt: Timestamp,
    mergedAt: Schema.NullOr(Timestamp),
  },
) {}

export class IssueThreadLink extends Schema.Class<IssueThreadLink>(
  "IssueThreadLink",
)({
  jamId: JamId,
  code: Schema.NullOr(Schema.String),
  title: Schema.String,
  status: Schema.String,
  captain: Schema.Boolean,
  owner: Schema.optionalKey(Schema.Boolean),
}) {}

export class IssueRelation extends Schema.Class<IssueRelation>("IssueRelation")(
  { relation: IssueRelationKind, issue: IssueSummary },
) {}

export class IssueRelationPage extends Schema.Class<IssueRelationPage>(
  "IssueRelationPage",
)({ relations: Schema.Array(IssueRelation), total: Schema.Int }) {}

export class IssueComment extends Schema.Class<IssueComment>("IssueComment")({
  id: IssueCommentId,
  parentCommentId: Schema.NullOr(IssueCommentId),
  replyToCommentId: Schema.NullOr(IssueCommentId),
  author: IssueActor,
  body: Schema.String,
  createdAt: Timestamp,
  editedAt: Schema.NullOr(Timestamp),
}) {}

export class IssueEvent extends Schema.Class<IssueEvent>("IssueEvent")({
  id: IssueEventId,
  kind: IssueEventKind,
  actor: Schema.NullOr(IssueActor),
  payload: Schema.Unknown,
  refs: Schema.Record(Schema.String, Schema.String),
  issueCode: Schema.NullOr(Schema.String),
  createdAt: Timestamp,
}) {}

export class IssueTimelineEvent extends Schema.Class<IssueTimelineEvent>(
  "IssueTimelineEvent",
)({
  id: IssueEventId,
  kind: Schema.String,
  actor: Schema.NullOr(IssueActor),
  payload: Schema.Unknown,
  refs: Schema.Record(Schema.String, Schema.String),
  issueCode: Schema.NullOr(Schema.String),
  createdAt: Timestamp,
}) {}

export class IssueFileDrive extends Schema.Class<IssueFileDrive>(
  "IssueFileDrive",
)({ location: Schema.String, path: Schema.String }) {}

export class IssueFile extends Schema.Class<IssueFile>("IssueFile")({
  fileId: FileId,
  commentId: Schema.NullOr(IssueCommentId),
  name: Schema.String,
  mediaType: Schema.String,
  sizeBytes: Schema.Int,
  drive: Schema.optionalKey(IssueFileDrive),
}) {}

export class IssueAccess extends Schema.Class<IssueAccess>("IssueAccess")({
  source: Schema.NullOr(IssueActor),
  people: Schema.Array(IssueActor),
  editable: Schema.Boolean,
}) {}

export class IssueDetail extends Schema.Class<IssueDetail>("IssueDetail")({
  issue: IssueSummary,
  description: Schema.String,
  files: Schema.Array(IssueFile),
  creator: Schema.NullOr(IssueActor),
  access: IssueAccess,
  parent: Schema.NullOr(IssueSummary),
  subIssues: Schema.Array(IssueSummary),
  pulls: Schema.Array(IssuePullLink),
  threads: Schema.Array(IssueThreadLink),
  relations: Schema.optionalKey(Schema.Array(IssueRelation)),
  relationCount: Schema.optionalKey(Schema.Int),
  comments: Schema.Array(IssueComment),
  events: Schema.Array(IssueEvent),
  timeline: Schema.optionalKey(Schema.Array(IssueTimelineEvent)),
}) {}

export class IssueList extends Schema.Class<IssueList>("IssueList")({
  issues: Schema.Array(IssueSummary),
  parents: Schema.optionalKey(Schema.Array(IssueSummary)),
  cursor: Schema.NullOr(Schema.String),
  prefix: Schema.String,
}) {}

export class IssueState extends Schema.Class<IssueState>("IssueState")({
  id: IssueStateId,
  name: Schema.String,
  type: IssueStateType,
  icon: IssueStateIcon,
  color: IssueColor,
  position: Schema.Int,
  isDefault: Schema.Boolean,
}) {}

export class IssueStateList extends Schema.Class<IssueStateList>(
  "IssueStateList",
)({ states: Schema.Array(IssueState) }) {}

export const IssueAssigneeInput = Schema.Struct({
  kind: Schema.Literals(["user", "jam"]),
  id: Schema.String,
});
export type IssueAssigneeInput = typeof IssueAssigneeInput.Type;

const IssueTitle = Schema.String.check(Schema.isBetweenLength(1, 500));
const IssueLabelIds = Schema.Array(IssueLabelId).check(Schema.isMaxLength(20));
const IssueAssignees = Schema.Array(IssueAssigneeInput).check(
  Schema.isMaxLength(10),
);

export const CreateIssueRequest = Schema.Struct({
  projectId: ProjectId,
  visibility: Schema.optionalKey(IssueVisibility),
  title: IssueTitle,
  description: Schema.optionalKey(Schema.String),
  status: Schema.optionalKey(IssueStatus),
  stateId: Schema.optionalKey(IssueStateId),
  priority: Schema.optionalKey(IssuePriority),
  dueAt: Schema.optionalKey(IssueDueDate),
  assignee: Schema.optionalKey(Schema.NullOr(IssueAssigneeInput)),
  assignees: Schema.optionalKey(IssueAssignees),
  parentCode: Schema.optionalKey(Schema.String),
  labelIds: Schema.optionalKey(IssueLabelIds),
});
export type CreateIssueRequest = typeof CreateIssueRequest.Type;

export const UpdateIssueRequest = Schema.Struct({
  title: Schema.optionalKey(IssueTitle),
  description: Schema.optionalKey(Schema.String),
  status: Schema.optionalKey(IssueStatus),
  stateId: Schema.optionalKey(IssueStateId),
  priority: Schema.optionalKey(IssuePriority),
  dueAt: Schema.optionalKey(Schema.NullOr(IssueDueDate)),
  assignee: Schema.optionalKey(Schema.NullOr(IssueAssigneeInput)),
  assignees: Schema.optionalKey(IssueAssignees),
  parentCode: Schema.optionalKey(Schema.NullOr(Schema.String)),
  visibility: Schema.optionalKey(IssueVisibility),
  labelIds: Schema.optionalKey(IssueLabelIds),
  threadOrder: Schema.optionalKey(
    Schema.Array(JamId).check(Schema.isMaxLength(100)),
  ),
});
export type UpdateIssueRequest = typeof UpdateIssueRequest.Type;

export const CommentIssueRequest = Schema.Struct({
  body: Schema.String,
  replyTo: Schema.optionalKey(IssueCommentId),
});

export const LinkIssueRequest = Schema.Struct({
  ref: Schema.String.check(Schema.isMinLength(1)),
});

export const IssueLinkTarget = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("pull"), pullId: PullRequestId }),
  Schema.Struct({ kind: Schema.Literal("thread"), jamId: JamId }),
]);
export type IssueLinkTarget = typeof IssueLinkTarget.Type;

export const UnlinkIssueRequest = Schema.Struct({ target: IssueLinkTarget });

export const RelateIssueRequest = Schema.Struct({
  relation: IssueRelationKind,
  issue: Schema.String.check(Schema.isMinLength(1)),
});

export const UnrelateIssueRequest = Schema.Struct({
  issue: Schema.String.check(Schema.isMinLength(1)),
});

export const SetIssueSubscriptionRequest = Schema.Struct({
  subscribed: Schema.Boolean,
});

export const IssueAssigneeUser = Schema.Struct({
  kind: Schema.Literal("user"),
  userId: UserId,
});
