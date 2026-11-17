import { Schema } from "effect";

export const EventId = Schema.String.check(Schema.isBetweenLength(26, 26)).pipe(
  Schema.brand("Core.EventId"),
);
export type EventId = typeof EventId.Type;

export const JamId = Schema.String.pipe(Schema.brand("Core.JamId"));
export type JamId = typeof JamId.Type;

export const UserId = Schema.String.pipe(Schema.brand("Core.UserId"));
export type UserId = typeof UserId.Type;

export const OrgId = Schema.String.pipe(Schema.brand("Core.OrgId"));
export type OrgId = typeof OrgId.Type;

export const ToolCallId = Schema.String.pipe(Schema.brand("Core.ToolCallId"));
export type ToolCallId = typeof ToolCallId.Type;

export const OperationId = Schema.String.pipe(Schema.brand("Core.OperationId"));
export type OperationId = typeof OperationId.Type;

export const FileId = Schema.String.pipe(Schema.brand("Core.FileId"));
export type FileId = typeof FileId.Type;

export const MachineId = Schema.String.pipe(Schema.brand("Core.MachineId"));
export type MachineId = typeof MachineId.Type;

export const ServiceUserId = Schema.String.pipe(
  Schema.brand("Core.ServiceUserId"),
);

export const AutomationId = Schema.String.pipe(
  Schema.brand("Core.AutomationId"),
);

export const AutomationRunId = Schema.String.pipe(
  Schema.brand("Core.AutomationRunId"),
);

export const RequestId = Schema.String.check(
  Schema.isBetweenLength(1, 191),
).pipe(Schema.brand("Core.RequestId"));

export const ClientId = Schema.String.check(
  Schema.isPattern(/^[A-Za-z0-9_-]{16,64}$/u),
).pipe(Schema.brand("Core.ClientId"));

export const McpSetupId = Schema.String.check(
  Schema.isBetweenLength(26, 26),
).pipe(Schema.brand("Core.McpSetupId"));

export const MobileSessionId = Schema.String.check(
  Schema.isBetweenLength(26, 26),
).pipe(Schema.brand("Core.MobileSessionId"));

export const HandoffId = Schema.String.check(
  Schema.isPattern(/^(hnd|ckp)_[0-9A-HJKMNP-TV-Z]{26}$/u),
).pipe(Schema.brand("Core.HandoffId"));

export const ReviewRuleId = Schema.String.check(
  Schema.isBetweenLength(32, 32),
).pipe(Schema.brand("Core.ReviewRuleId"));
