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

export const Timestamp = Schema.DateTimeUtcFromString;
