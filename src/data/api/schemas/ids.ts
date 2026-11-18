import { Schema } from "effect";

export const UserId = Schema.String.pipe(Schema.brand("Core.UserId"));
export type UserId = typeof UserId.Type;

export const ServiceUserId = Schema.String.pipe(
  Schema.brand("Core.ServiceUserId"),
);
export type ServiceUserId = typeof ServiceUserId.Type;

export const ActorId = Schema.Union([UserId, ServiceUserId]);
export type ActorId = typeof ActorId.Type;

export const OrgId = Schema.String.pipe(Schema.brand("Core.OrgId"));
export type OrgId = typeof OrgId.Type;

export const ProjectId = Schema.String.pipe(Schema.brand("Core.ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const JamId = Schema.String.pipe(Schema.brand("Core.JamId"));
export type JamId = typeof JamId.Type;

export const EventId = Schema.String.pipe(Schema.brand("Core.EventId"));
export type EventId = typeof EventId.Type;

export const ThreadFolderId = Schema.String.pipe(
  Schema.brand("Core.ThreadFolderId"),
);
export type ThreadFolderId = typeof ThreadFolderId.Type;

export const ThreadTagId = Schema.String.pipe(Schema.brand("Core.ThreadTagId"));
export type ThreadTagId = typeof ThreadTagId.Type;

export const PullRequestId = Schema.String.pipe(
  Schema.brand("Core.PullRequestId"),
);
export type PullRequestId = typeof PullRequestId.Type;

export const IssueId = Schema.String.pipe(Schema.brand("Core.IssueId"));
export type IssueId = typeof IssueId.Type;

export const IssueCommentId = Schema.String.pipe(
  Schema.brand("Core.IssueCommentId"),
);
export type IssueCommentId = typeof IssueCommentId.Type;

export const IssueEventId = Schema.String.pipe(
  Schema.brand("Core.IssueEventId"),
);
export type IssueEventId = typeof IssueEventId.Type;

export const IssueStateId = Schema.String.pipe(
  Schema.brand("Core.IssueStateId"),
);
export type IssueStateId = typeof IssueStateId.Type;

export const IssueLabelId = Schema.String.pipe(
  Schema.brand("Core.IssueLabelId"),
);
export type IssueLabelId = typeof IssueLabelId.Type;

export const Timestamp = Schema.DateTimeUtcFromString;

export const AutomationId = Schema.String.pipe(
  Schema.brand("Core.AutomationId"),
);
export type AutomationId = typeof AutomationId.Type;

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

export const McpSetupId = Schema.String.pipe(Schema.brand("Core.McpSetupId"));
export type McpSetupId = typeof McpSetupId.Type;

export const McpServerId = Schema.String.pipe(Schema.brand("Core.McpServerId"));
export type McpServerId = typeof McpServerId.Type;

export const PluginInstallationId = Schema.String.pipe(
  Schema.brand("Core.PluginInstallationId"),
);
export type PluginInstallationId = typeof PluginInstallationId.Type;

export const ToolCallId = Schema.String.pipe(Schema.brand("Core.ToolCallId"));
export type ToolCallId = typeof ToolCallId.Type;
