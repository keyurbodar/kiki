import { Schema } from "effect";
import { EventState, Mention, ModelModes, ReasoningMode } from "./common";
import { EventId, JamId } from "./ids";
import {
  AssistantPayload,
  CompactPayload,
  ContextPayload,
  ControlPayload,
  ErrorPayload,
  HandoffPayload,
  LegacyPayload,
  MessagePayload,
  MobileSessionPayload,
  NotificationPayload,
  OperationCompletionPayload,
  ReviewRequestPayload,
  RulePayload,
  TaskCompletionPayload,
  ThreadCompletionPayload,
  ToolResultPayload,
} from "./payloads";
import { unsupportedTag } from "./unsupported";

const optional = Schema.optional;

/** Payload schema per stored event kind, in the bundle's order. */
export const EventPayloads = {
  message: MessagePayload,
  control: ControlPayload,
  notification: NotificationPayload,
  rule: RulePayload,
  review_request: ReviewRequestPayload,
  task_completion: TaskCompletionPayload,
  operation_completion: OperationCompletionPayload,
  context: ContextPayload,
  assistant: AssistantPayload,
  tool_result: ToolResultPayload,
  error: ErrorPayload,
  compact: CompactPayload,
  legacy: LegacyPayload,
  mobile_session: MobileSessionPayload,
  handoff: HandoffPayload,
  thread_completion: ThreadCompletionPayload,
} as const;

export const EVENT_KINDS = [
  "message",
  "control",
  "notification",
  "rule",
  "review_request",
  "task_completion",
  "operation_completion",
  "context",
  "assistant",
  "tool_result",
  "error",
  "compact",
  "legacy",
  "mobile_session",
  "handoff",
  "thread_completion",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

const row = <K extends EventKind>(kind: K) =>
  Schema.Struct({
    id: EventId,
    jamId: JamId,
    kind: Schema.Literal(kind),
    state: EventState,
    payload: EventPayloads[kind],
    createdAt: Schema.DateFromString,
  });

export const MessageEvent = row("message");
export const ControlEvent = row("control");
export const NotificationEvent = row("notification");
export const RuleEvent = row("rule");
export const ReviewRequestEvent = row("review_request");
export const TaskCompletionEvent = row("task_completion");
export const OperationCompletionEvent = row("operation_completion");
export const ContextEvent = row("context");
export const AssistantEvent = row("assistant");
export const ToolResultEvent = row("tool_result");
export const ErrorEvent = row("error");
export const CompactEvent = row("compact");
export const LegacyEvent = row("legacy");
export const MobileSessionEvent = row("mobile_session");
export const HandoffEvent = row("handoff");
export const ThreadCompletionEvent = row("thread_completion");

/** A kind this client doesn't know: kept with its envelope, payload dropped. */
export const UnsupportedEvent = unsupportedTag("kind", EVENT_KINDS, {
  id: EventId,
  jamId: JamId,
  state: EventState,
  createdAt: Schema.DateFromString,
});

/** One stored thread event, as `GET events` and the NDJSON stream send it. */
export const EventRow = Schema.Union([
  MessageEvent,
  ControlEvent,
  NotificationEvent,
  RuleEvent,
  ReviewRequestEvent,
  TaskCompletionEvent,
  OperationCompletionEvent,
  ContextEvent,
  AssistantEvent,
  ToolResultEvent,
  ErrorEvent,
  CompactEvent,
  LegacyEvent,
  MobileSessionEvent,
  HandoffEvent,
  ThreadCompletionEvent,
  UnsupportedEvent,
]).annotate({ identifier: "EventRow" });
export type EventRow = typeof EventRow.Type;
export type EventRowEncoded = typeof EventRow.Encoded;

/** `GET /orgs/:orgId/jams/:jamId/events` */
export class EventPage extends Schema.Class<EventPage>("EventPage")({
  items: Schema.Array(EventRow),
  cursor: Schema.NullOr(EventId),
  serverNow: optional(Schema.DateFromString),
}) {}

const streamLines = [
  Schema.Struct({
    kind: Schema.Literal("page"),
    serverNow: Schema.DateFromString,
  }),
  Schema.Struct({ kind: Schema.Literal("event"), item: EventRow }),
  Schema.Struct({
    kind: Schema.Literal("end"),
    cursor: Schema.NullOr(EventId),
    avatarUrls: Schema.Record(Schema.String, Schema.String),
  }),
] as const;

/** One line of `GET /orgs/:orgId/jams/:jamId/events/stream` (application/x-ndjson). */
export const EventStreamLine = Schema.Union([
  ...streamLines,
  unsupportedTag("kind", ["page", "event", "end"]),
]).annotate({ identifier: "EventStreamLine" });
export type EventStreamLine = typeof EventStreamLine.Type;

export const ContextSegment = Schema.Struct({
  key: Schema.Literals([
    "system",
    "tools",
    "rules",
    "skills",
    "mcp",
    "environment",
    "conversation",
  ]),
  tokens: Schema.Number,
}).annotate({ identifier: "ContextSegment" });

/** `GET events/context-usage`: drives the context meter. */
export class ContextUsage extends Schema.Class<ContextUsage>("ContextUsage")({
  usedTokens: Schema.Number,
  budgetTokens: Schema.Number,
  bound: Schema.Literals(["context", "input"]),
  segments: optional(Schema.Array(ContextSegment)),
  modelId: optional(Schema.String),
  compactAtTokens: optional(Schema.Number),
  defaultCompactAtTokens: optional(Schema.Number),
  windowTokens: optional(Schema.Number),
  threadCompactAtTokens: optional(Schema.Number),
}) {}

/** `POST message`, `interrupt`, `compact` */
export class AdmitReceipt extends Schema.Class<AdmitReceipt>("AdmitReceipt")({
  id: EventId,
  deduped: Schema.Boolean,
}) {}

export class CancelMessageOutcome extends Schema.Class<CancelMessageOutcome>(
  "CancelMessageOutcome",
)({ outcome: Schema.Literals(["cancelled", "tooLate"]) }) {}

export class SendNowOutcome extends Schema.Class<SendNowOutcome>(
  "SendNowOutcome",
)({
  outcome: Schema.Literals(["sent", "tooLate"]),
  id: optional(EventId),
}) {}

export class MessageVersion extends Schema.Class<MessageVersion>(
  "MessageVersion",
)({
  id: EventId,
  text: Schema.String,
  createdAt: Schema.DateFromString,
  live: Schema.Boolean,
}) {}

/** `GET messages/:eventId/versions` */
export class MessageVersionsWithBranches extends Schema.Class<MessageVersionsWithBranches>(
  "MessageVersionsWithBranches",
)({
  root: EventId,
  versions: Schema.Array(
    Schema.Struct({ ...MessageVersion.fields, branch: Schema.Array(EventRow) }),
  ),
}) {}

/** `POST message` body. `files` is the upload list; its shape belongs to A3's files group. */
export const SendMessageRequest = Schema.Struct({
  text: Schema.String,
  mentions: optional(Schema.Array(Mention)),
  model: optional(
    Schema.Struct({
      modelId: Schema.String,
      reasoningMode: optional(ReasoningMode),
      modes: optional(ModelModes),
    }),
  ),
  delivery: optional(Schema.Literals(["queue", "steer", "interrupt"])),
  files: optional(Schema.Unknown),
  clientKey: optional(Schema.String),
  editOf: optional(EventId),
  switchTo: optional(EventId),
  retryOf: optional(EventId),
});
