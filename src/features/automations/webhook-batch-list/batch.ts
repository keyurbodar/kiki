import { Schema } from "effect";

export const WebhookBatchStatus = Schema.Literals([
  "collecting",
  "queued",
  "cancelled",
]);
export type WebhookBatchStatus = typeof WebhookBatchStatus.Type;

export const WebhookBatchReason = Schema.Literals([
  "count",
  "quiet",
  "max_wait",
  "bytes",
  "manual",
  "cancelled",
  "configuration_changed",
  "disabled",
  "project_deleted",
]);
export type WebhookBatchReason = typeof WebhookBatchReason.Type;

export const WebhookBatchRunStatus = Schema.Literals([
  "queued",
  "running",
  "completed",
  "failed",
  "skipped",
  "cancelled",
]);
export type WebhookBatchRunStatus = typeof WebhookBatchRunStatus.Type;

export const WebhookBatchGroupValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.Boolean,
]);
export type WebhookBatchGroupValue = typeof WebhookBatchGroupValue.Type;

export class AutomationWebhookBatch extends Schema.Class<AutomationWebhookBatch>(
  "AutomationWebhookBatch",
)({
  id: Schema.String,
  automationId: Schema.String,
  triggerId: Schema.String,
  status: WebhookBatchStatus,
  group: Schema.Array(WebhookBatchGroupValue),
  eventCount: Schema.Number,
  byteCount: Schema.Number,
  firstEventAt: Schema.DateFromString,
  lastEventAt: Schema.DateFromString,
  dispatchAfter: Schema.DateFromString,
  maxEvents: Schema.Number,
  maxWaitSeconds: Schema.Number,
  quietPeriodSeconds: Schema.NullOr(Schema.Number),
  closedAt: Schema.NullOr(Schema.DateFromString),
  reason: Schema.NullOr(WebhookBatchReason),
  runId: Schema.NullOr(Schema.String),
  runStatus: Schema.NullOr(WebhookBatchRunStatus),
  jamId: Schema.NullOr(Schema.String),
  failure: Schema.NullOr(Schema.String),
}) {}

export class AutomationWebhookBatchPage extends Schema.Class<AutomationWebhookBatchPage>(
  "AutomationWebhookBatchPage",
)({
  items: Schema.Array(AutomationWebhookBatch),
  cursor: Schema.NullOr(Schema.String),
}) {}

export const decodeWebhookBatch = Schema.decodeUnknownOption(
  AutomationWebhookBatch,
);
export const decodeWebhookBatchPage = Schema.decodeUnknownOption(
  AutomationWebhookBatchPage,
);
