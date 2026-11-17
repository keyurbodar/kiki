import { Schema } from "effect";
import { FileRef, RunStatus } from "./common";
import { JamId, OrgId, ToolCallId, UserId } from "./ids";
import { unsupportedTag } from "./unsupported";

const optional = Schema.optional;
const ProviderMetadata = Schema.Record(
  Schema.String,
  Schema.Record(Schema.String, Schema.Unknown),
).annotate({ identifier: "LLM.ProviderMetadata" });
const meta = { providerMetadata: optional(ProviderMetadata) };

export const FinishReason = Schema.Literals([
  "stop",
  "length",
  "tool-calls",
  "content-filter",
  "error",
  "unknown",
]);

export const LlmUsage = Schema.Struct({
  inputTokens: optional(Schema.Number),
  outputTokens: optional(Schema.Number),
  nonCachedInputTokens: optional(Schema.Number),
  cacheReadInputTokens: optional(Schema.Number),
  cacheWriteInputTokens: optional(Schema.Number),
  reasoningTokens: optional(Schema.Number),
  totalTokens: optional(Schema.Number),
  providerMetadata: optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Usage" });

const ToolContent = Schema.Union([
  Schema.Struct({ type: Schema.Literal("text"), text: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("file"),
    uri: Schema.String,
    mime: Schema.String,
    name: optional(Schema.String),
  }),
]);

/** A provider stream event, forwarded live while a model turn runs. */
export const LlmEvent = Schema.Union([
  Schema.Struct({ type: Schema.Literal("step-start"), index: Schema.Number }),
  Schema.Struct({
    type: Schema.Literal("text-start"),
    id: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("text-delta"),
    id: Schema.String,
    text: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("text-end"),
    id: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("reasoning-start"),
    id: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("reasoning-delta"),
    id: Schema.String,
    text: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("reasoning-end"),
    id: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("fallback"),
    provider: Schema.String,
    fromModel: optional(Schema.String),
    toModel: optional(Schema.String),
    trigger: optional(
      Schema.Struct({ type: Schema.String, category: optional(Schema.String) }),
    ),
  }),
  Schema.Struct({
    type: Schema.Literal("tool-input-start"),
    id: Schema.String,
    name: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-input-delta"),
    id: Schema.String,
    name: Schema.String,
    text: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-input-end"),
    id: Schema.String,
    name: Schema.String,
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-call"),
    id: Schema.String,
    name: Schema.String,
    input: Schema.Unknown,
    providerExecuted: optional(Schema.Boolean),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-result"),
    id: Schema.String,
    name: Schema.String,
    result: Schema.Unknown,
    output: optional(
      Schema.Struct({
        structured: Schema.Unknown,
        content: Schema.Array(ToolContent),
      }),
    ),
    providerExecuted: optional(Schema.Boolean),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-search-call"),
    id: Schema.String,
    name: Schema.String,
    input: Schema.Unknown,
    providerExecuted: optional(Schema.Boolean),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-search-result"),
    id: Schema.String,
    name: Schema.String,
    tools: Schema.Array(Schema.Struct({ definition: Schema.Unknown })),
    error: optional(
      Schema.Struct({ code: Schema.String, message: Schema.String }),
    ),
    providerExecuted: optional(Schema.Boolean),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-error"),
    id: Schema.String,
    name: Schema.String,
    message: Schema.String,
    error: optional(Schema.Unknown),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("media"),
    id: Schema.String,
    mediaType: Schema.String,
    data: Schema.String.annotate({ description: "base64 bytes" }),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("step-finish"),
    index: Schema.Number,
    reason: FinishReason,
    usage: optional(LlmUsage),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("finish"),
    reason: FinishReason,
    usage: optional(LlmUsage),
    ...meta,
  }),
  Schema.Struct({
    type: Schema.Literal("provider-error"),
    message: Schema.String,
    code: optional(Schema.String),
    errorType: optional(Schema.String),
    status: optional(Schema.Number),
    headers: optional(Schema.Record(Schema.String, Schema.String)),
    body: optional(Schema.String),
    classification: optional(
      Schema.Literals([
        "context-overflow",
        "tool-choice",
        "model-unsupported",
        "media-fetch",
        "signed-history",
        "region-unsupported",
      ]),
    ),
    retryable: optional(Schema.Boolean),
    ...meta,
  }),
]).annotate({ identifier: "LLM.Event" });
export type LlmEvent = typeof LlmEvent.Type;

/** One program call inside an `execute` tool, as streamed while it runs. */
export const ExecuteCall = Schema.Struct({
  tool: Schema.String,
  input: Schema.Unknown,
  durationMs: optional(Schema.Number),
  data: optional(Schema.Unknown),
  preview: optional(
    Schema.Struct({ text: Schema.String, chars: Schema.Number }),
  ),
  error: optional(Schema.String),
});

const deltaMembers = [
  Schema.Struct({
    type: Schema.Literal("tool-activity"),
    toolCallId: ToolCallId,
    calls: Schema.Array(
      Schema.Struct({
        index: Schema.Number,
        phase: Schema.Literals(["forming", "running", "done", "failed"]),
        call: ExecuteCall,
      }),
    ),
  }),
  Schema.Struct({
    type: Schema.Literal("upload-progress"),
    toolCallId: ToolCallId,
    files: Schema.Array(
      Schema.Struct({
        index: Schema.Number,
        loaded: Schema.Number,
        total: Schema.Number,
      }),
    ),
  }),
  Schema.Struct({
    type: Schema.Literal("transfer-progress"),
    toolCallId: ToolCallId,
    step: Schema.Literals(["packing", "sending", "saving", "done"]),
    loaded: optional(Schema.Number),
    total: optional(Schema.Number),
  }),
  Schema.Struct({
    type: Schema.Literal("file-uploaded"),
    toolCallId: ToolCallId,
    index: Schema.Number,
    file: FileRef,
  }),
  Schema.Struct({ type: Schema.Literal("run-start") }),
  Schema.Struct({
    type: Schema.Literal("run-end"),
    status: optional(RunStatus),
  }),
  Schema.Struct({ type: Schema.Literal("turn-start") }),
  Schema.Struct({ type: Schema.Literal("compaction-start") }),
  Schema.Struct({ type: Schema.Literal("llm-event"), event: LlmEvent }),
  Schema.Struct({
    type: Schema.Literal("turn-end"),
    outcome: Schema.Literals(["settled", "aborted"]),
  }),
] as const;

export const LIVE_DELTA_TYPES = deltaMembers.map((m) => m.fields.type.literal);

/** Live, unpersisted progress for the open turn. Drives shimmer, forming tool calls and progress bars. */
export const LiveDelta = Schema.Union([
  ...deltaMembers,
  unsupportedTag("type", LIVE_DELTA_TYPES),
]).annotate({ identifier: "LLM.Delta" });
export type LiveDelta = typeof LiveDelta.Type;

export const RealtimeScope = Schema.Union([
  Schema.TemplateLiteral(["org:", Schema.String]),
  Schema.TemplateLiteral(["project:", Schema.String]),
  Schema.TemplateLiteral(["jam:", Schema.String]),
  Schema.TemplateLiteral(["user:", Schema.String]),
  Schema.TemplateLiteral(["pull:", Schema.String]),
]).annotate({ identifier: "Realtime.Scope" });

export const CDC_TABLES = (
  "jam.jam_event.jam_participant.jam_pull_state.operation.machine.machine_backing.machine_attachment." +
  "project_setup_run.device.device_thread_access.device_agent_access.device_computer_use_access." +
  "slack_user_read_access.device_project_checkout.ledger.turn_diff.turn_capture.attachment_version." +
  "thread_folder.thread_folder_item.thread_folder_user.user_announcement.onboarding_step_skip." +
  "onboarding_dismissal.thread_notification.thread_request.jam_read.jam_settle.user_theme." +
  "user_client_appearance.appearance_change.user.issue.issue_comment.issue_event.issue_pull." +
  "issue_thread.issue_assignee.issue_subscriber.issue_state.issue_label.issue_label_link." +
  "issue_relation.org.thread_tag.thread_tag_assignment.project.project_member.pull_summary.pull." +
  "pull_check.pull_commit.pull_comment.pull_review.org_pull.github_installation.automation." +
  "automation_run.volume.mobile_session.paper_file_reference.slack_channel.captain.captain_user." +
  "captain_library_image.jam_relation.entitlement.model_catalog.model_credential.connection_model." +
  "org_model_setting.model_oauth_credential.service_user"
).split(".");

const Ping = Schema.Struct({
  type: Schema.Literal("ping"),
  sentAt: optional(Schema.Number),
});

/** Client to realtime host (WebSocket, JSON text frames). */
export const RealtimeClientMessage = Schema.Union([
  Schema.Struct({ type: Schema.Literal("auth"), token: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("subscribe"),
    scopes: Schema.Array(RealtimeScope),
    tables: optional(Schema.Array(Schema.String)),
    jamOnlyTables: optional(Schema.Array(Schema.String)),
  }),
  Schema.Struct({
    type: Schema.Literal("unsubscribe"),
    scopes: Schema.Array(RealtimeScope),
  }),
  Ping,
]).annotate({ identifier: "Realtime.ClientMessage" });

/** A row changed: refetch whatever reads that table in that scope. A `jam_event` hint is the cue to read new events. */
export const CdcHint = Schema.Struct({
  type: Schema.Literal("hint"),
  table: Schema.Literals(
    CDC_TABLES as unknown as readonly [string, ...string[]],
  ),
  op: Schema.Literals(["insert", "update", "delete"]),
  scopes: Schema.Struct({
    orgId: optional(OrgId),
    projectId: optional(Schema.String),
    jamId: optional(JamId),
    rootJamId: optional(JamId),
    userId: optional(UserId),
    pullId: optional(Schema.String),
    issueId: optional(Schema.String),
    parentIssueId: optional(Schema.String),
    provider: optional(Schema.Literal("github")),
    providerRepoId: optional(Schema.String),
  }),
  changedColumns: Schema.Array(Schema.String),
  sourceId: optional(Schema.String),
  sourceCommittedAt: optional(Schema.Number),
  hintId: optional(Schema.String),
  traceparent: optional(Schema.String),
}).annotate({ identifier: "CdcHint" });

/** Realtime host to client. */
export const RealtimeServerMessage = Schema.Union([
  CdcHint,
  Schema.Struct({
    type: Schema.Literal("delta"),
    jamId: JamId,
    delta: LiveDelta,
  }),
  Schema.Struct({
    type: Schema.Literal("subscribed"),
    scopes: Schema.Array(RealtimeScope),
  }),
  Schema.Struct({
    type: Schema.Literal("pong"),
    sentAt: optional(Schema.Number),
    serverTime: optional(Schema.Number),
  }),
]).annotate({ identifier: "Realtime.ServerMessage" });
export type RealtimeServerMessage = typeof RealtimeServerMessage.Type;

/** Server frames arrive as JSON text. */
export const RealtimeServerFrame = Schema.fromJsonString(RealtimeServerMessage);
