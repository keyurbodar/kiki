import { Schema } from "effect";
import {
  Actor,
  Delivery,
  DeliveryState,
  DriveReference,
  FileRef,
  FileSource,
  Mention,
  ModelDefault,
  Origin,
  ReasoningMode,
  TitledFile,
  WireContentBlock,
} from "./common";
import { EventId, JamId, MachineId, OperationId, ToolCallId } from "./ids";
import { ExecuteCall } from "./live";
import { PrFeedback } from "./payloads";

/**
 * The timeline row model the thread view renders. Capy derives these rows on
 * the client from the event stream (stored events plus live deltas); they are
 * not sent over the wire. Dates use DateFromString so fixtures can be JSON.
 */

const optional = Schema.optional;
const DateString = Schema.DateFromString;

const base = {
  id: Schema.String,
  eventId: EventId,
  createdAt: DateString,
  exchangeId: optional(Schema.String),
};

/** Settled tool result attached to a tool activity line. */
export const ToolSettlement = Schema.Struct({
  blocks: Schema.Array(WireContentBlock),
  data: optional(Schema.Unknown),
  isError: Schema.Boolean,
  settledAt: DateString,
  eventId: optional(EventId),
});

export const UserMessageRow = Schema.Struct({
  ...base,
  type: Schema.Literal("user-message"),
  text: Schema.String,
  mentions: Schema.Array(Mention),
  files: Schema.Array(FileRef),
  delivery: Delivery,
  actor: Actor,
  origin: Origin,
  showOrigin: Schema.Boolean,
  state: Schema.Literals([
    "pending",
    "answered",
    "cancelled",
    "failed",
    "promoted",
  ]),
  clientKey: optional(Schema.String),
  editOf: optional(EventId),
  defaulted: optional(
    Schema.Struct({ modelId: Schema.String, modelDefault: ModelDefault }),
  ),
  versionRoot: optional(EventId),
});

export const AgentMessageRow = Schema.Struct({
  ...base,
  type: Schema.Literal("agent-message"),
  startedAt: optional(DateString),
  settled: Schema.Boolean,
  interrupted: Schema.Boolean,
  turnCloses: Schema.Boolean,
  text: Schema.String,
  files: Schema.Array(TitledFile),
  uploads: Schema.Array(Schema.Unknown),
  placed: Schema.Array(Schema.Unknown),
  placing: Schema.Array(Schema.Unknown),
  sources: optional(Schema.Array(FileSource)),
  references: optional(Schema.Array(DriveReference)),
  modelId: Schema.String,
  reasoningMode: optional(ReasoningMode),
  mode: optional(Schema.Literals(["fast", "pro"])),
  exchangeEventId: optional(EventId),
});

const activityBase = {
  ...base,
  type: Schema.Literal("activity"),
  startedAt: optional(DateString),
  turnOpen: Schema.Boolean,
  turnCloses: Schema.Boolean,
  sleptAfter: optional(Schema.Boolean),
};

export const ToolPhase = Schema.Literals([
  "forming",
  "running",
  "done",
  "failed",
]);

/** What a tool line is waiting on, shown as its trailing state. */
export const ToolAsk = Schema.Literals([
  "waiting",
  "answered",
  "added",
  "pending",
  "done",
  "expired",
  "sent",
  "declined",
]);

export const ActivityRow = Schema.Union([
  Schema.Struct({
    ...activityBase,
    kind: Schema.Literal("text"),
    text: Schema.String,
  }),
  Schema.Struct({
    ...activityBase,
    kind: Schema.Literal("reasoning"),
    text: Schema.String,
    presentation: Schema.Literals(["displayed", "summary"]),
    elapsedMs: Schema.Number,
  }),
  Schema.Struct({
    ...activityBase,
    kind: Schema.Literal("tool"),
    toolName: Schema.String,
    /** The server a namespaced call came from, `automation__create` → `automation`. */
    namespace: optional(Schema.String),
    args: Schema.Unknown,
    phase: ToolPhase,
    result: optional(ToolSettlement),
    ask: optional(ToolAsk),
    untimed: optional(Schema.Boolean),
    call: optional(ExecuteCall),
    liveCalls: optional(
      Schema.Array(
        Schema.Struct({
          index: Schema.Number,
          phase: ToolPhase,
          call: ExecuteCall,
        }),
      ),
    ),
  }),
  Schema.Struct({
    ...activityBase,
    kind: Schema.Literal("fallback"),
    provider: Schema.String,
    fromModel: optional(Schema.String),
    toModel: optional(Schema.String),
  }),
  Schema.Struct({
    ...activityBase,
    kind: Schema.Literal("wire"),
    text: Schema.String,
  }),
]);

export const MARKER_KINDS = [
  "access",
  "archive",
  "captain",
  "compaction",
  "credits",
  "crew",
  "environment",
  "fork",
  "handoff",
  "issues",
  "machine",
  "new",
  "offline",
  "permission",
  "retry",
  "return",
  "review",
  "setup",
  "switch",
  "takeover",
  "unsupported",
] as const;

/** A centred divider line: handoffs, compaction, access changes, the "New" line. */
export const MarkerRow = Schema.Struct({
  ...base,
  type: Schema.Literal("marker"),
  kind: Schema.Literals(MARKER_KINDS),
  label: Schema.String,
  title: optional(Schema.String),
  live: optional(Schema.Boolean),
  reference: optional(
    Schema.Struct({ jamId: optional(JamId), title: optional(Schema.String) }),
  ),
  referenceLeads: optional(Schema.Unknown),
  access: optional(Schema.Unknown),
});

const TaskReference = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("task"), localIndex: Schema.Number }),
  Schema.Struct({
    kind: Schema.Literal("thread"),
    code: Schema.String,
    title: Schema.NullOr(Schema.String),
    pullRequests: Schema.Array(Schema.Unknown),
  }),
]);

export const UpdateRow = Schema.Union([
  Schema.Struct({
    ...base,
    type: Schema.Literal("update"),
    kind: Schema.Literal("notice"),
    notificationKey: Schema.String,
    summary: Schema.String,
    prFeedback: optional(PrFeedback),
    fileSaved: optional(Schema.Unknown),
    slackMessage: optional(Schema.Unknown),
    ciResult: optional(Schema.Unknown),
    desktopRequest: optional(Schema.Unknown),
    filesCopied: optional(Schema.Unknown),
    prTransition: optional(Schema.Unknown),
    prConflict: optional(Schema.Unknown),
    reviewFailed: optional(Schema.Unknown),
    githubEvent: optional(Schema.Unknown),
    webhookRequest: optional(Schema.Unknown),
    issueActivity: optional(Schema.Unknown),
    ciUnsettled: optional(Schema.Unknown),
  }),
  Schema.Struct({
    ...base,
    type: Schema.Literal("update"),
    kind: Schema.Literal("task"),
    childJamId: JamId,
    reference: TaskReference,
    outcome: Schema.Literals(["completed", "failed", "stopped", "archived"]),
    deliveryState: optional(DeliveryState),
    ask: optional(Schema.String),
    needs: optional(Schema.Literals(["captain", "person"])),
    answered: optional(Schema.Unknown),
    summary: Schema.String,
    attachments: Schema.Array(TitledFile),
    sources: optional(Schema.Array(FileSource)),
    references: optional(Schema.Array(DriveReference)),
  }),
  Schema.Struct({
    ...base,
    type: Schema.Literal("update"),
    kind: Schema.Literal("review"),
    prNumber: optional(Schema.Number),
    issues: optional(Schema.Number),
  }),
  Schema.Struct({
    ...base,
    type: Schema.Literal("update"),
    kind: Schema.Literal("operation"),
    operationId: OperationId,
    toolCallId: ToolCallId,
    blocks: Schema.Array(WireContentBlock),
    isError: Schema.Boolean,
    commandLabel: optional(Schema.String),
    watch: optional(Schema.Unknown),
    watchEnded: optional(Schema.Unknown),
  }),
]);

export const ErrorRow = Schema.Struct({
  ...base,
  type: Schema.Literal("error"),
  severity: Schema.Literals(["warning", "error"]),
  code: Schema.String,
  message: Schema.String,
  retryable: Schema.Boolean,
  data: optional(Schema.Unknown),
  notice: optional(Schema.Unknown),
  setup: optional(Schema.Unknown),
  machineEpisode: optional(Schema.Unknown),
  credits: optional(Schema.Literals(["open", "waiting", "settled"])),
  creditsUntilMs: optional(Schema.Number),
  creditsOutcome: optional(Schema.Unknown),
  creditsSwitchedTo: optional(Schema.String),
  subagent: optional(Schema.Struct({ jamId: JamId, path: Schema.String })),
});

const cardBase = { ...base, turnCloses: Schema.Boolean };

export const ClarifyRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("clarify"),
  questions: Schema.Array(
    Schema.Struct({
      question: Schema.String,
      options: Schema.Array(Schema.String),
      multiSelect: Schema.Boolean,
    }),
  ),
});

export const EnvironmentRequestRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("environment-request"),
  request: Schema.Struct({
    toolCallId: ToolCallId,
    variables: Schema.Array(Schema.String),
    reason: Schema.String,
  }),
  fulfilled: Schema.Boolean,
  repliedPast: Schema.Boolean,
});

const requestMachine = Schema.Struct({
  machineId: MachineId,
  jamId: optional(JamId),
});

export const DesktopRequestRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("desktop-request"),
  toolCallId: ToolCallId,
  assistantEventId: EventId,
  reason: Schema.String,
  machine: requestMachine,
  screenshot: optional(Schema.Unknown),
  state: Schema.Literals(["pending", "done", "expired"]),
  repliedPast: Schema.Boolean,
});

export const TerminalRequestRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("terminal-request"),
  toolCallId: ToolCallId,
  assistantEventId: EventId,
  command: Schema.String,
  reason: Schema.String,
  machine: requestMachine,
  operationId: optional(OperationId),
  repliedPast: Schema.Boolean,
});

export const FeedbackRequestRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("feedback-request"),
  toolCallId: ToolCallId,
  assistantEventId: EventId,
});

export const McpSetupRow = Schema.Struct({
  ...cardBase,
  type: Schema.Literal("mcp-setup"),
  assistantEventId: EventId,
  toolResultEventId: EventId,
  toolCallId: ToolCallId,
  proposal: Schema.Unknown,
  notificationEventId: optional(EventId),
});

export const PhoneCardRow = Schema.Struct({
  ...base,
  type: Schema.Literal("phone-card"),
  machineId: MachineId,
  summary: Schema.String,
});

export const MobileSessionRow = Schema.Struct({
  ...base,
  type: Schema.Literal("mobile-session"),
  sessionId: Schema.String,
  platform: Schema.Literals(["ios", "android"]),
  appName: Schema.String,
  deviceModel: optional(Schema.String),
  status: Schema.Literals([
    "queued",
    "starting",
    "active",
    "stopped",
    "failed",
  ]),
});

export const VisualRow = Schema.Struct({
  ...base,
  type: Schema.Literal("visual"),
  toolCallId: ToolCallId,
  title: Schema.String,
  html: Schema.String,
});

/** End-of-turn card listing the PRs, ports, requests and setup changes a turn produced. */
export const SummaryRow = Schema.Struct({
  ...base,
  type: Schema.Literal("summary"),
  prs: Schema.Array(
    Schema.Struct({
      kind: Schema.Literal("pr"),
      number: Schema.Number,
      url: Schema.String,
      alreadyExists: Schema.Boolean,
    }),
  ),
  ports: Schema.Array(
    Schema.Struct({
      kind: Schema.Literal("port"),
      title: Schema.String,
      owningJamId: optional(Schema.String),
      machineId: Schema.String,
      port: Schema.Number,
    }),
  ),
  environmentRequests: Schema.Array(Schema.Unknown),
  setup: Schema.Array(Schema.Unknown),
  automations: Schema.Array(Schema.Unknown),
  appearances: Schema.Array(Schema.Unknown),
});

/** Rows that can sit inside a work group or a cluster. */
export const GroupEntry = Schema.Union([ActivityRow, UpdateRow]);

/** "Worked for 3m" group: the collapsible run of activity lines in one exchange. */
export const WorkGroupRow = Schema.Struct({
  ...base,
  type: Schema.Literal("work-group"),
  activeMs: Schema.Number,
  /** Failed calls in the group, not counting ones the agent retried successfully. */
  failures: Schema.Number,
  entries: Schema.Array(GroupEntry),
  chunks: Schema.Array(Schema.Unknown),
  live: Schema.Boolean,
  startedAt: optional(DateString),
  startedAtServer: optional(DateString),
  waiting: optional(Schema.Unknown),
  expanded: Schema.Boolean,
});

/** Consecutive update rows folded into one expandable line. */
export const ClusterRow = Schema.Struct({
  ...base,
  type: Schema.Literal("cluster"),
  members: Schema.Array(UpdateRow),
  expanded: Schema.Boolean,
});

export const TimelineRow = Schema.Union([
  UserMessageRow,
  AgentMessageRow,
  ActivityRow,
  MarkerRow,
  UpdateRow,
  ErrorRow,
  WorkGroupRow,
  ClusterRow,
  VisualRow,
  SummaryRow,
  ClarifyRow,
  EnvironmentRequestRow,
  DesktopRequestRow,
  TerminalRequestRow,
  FeedbackRequestRow,
  McpSetupRow,
  PhoneCardRow,
  MobileSessionRow,
]).annotate({ identifier: "TimelineRow" });
export type TimelineRow = typeof TimelineRow.Type;
export type TimelineRowEncoded = typeof TimelineRow.Encoded;

export const TIMELINE_ROW_TYPES = [
  "user-message",
  "agent-message",
  "activity",
  "marker",
  "update",
  "error",
  "work-group",
  "cluster",
  "visual",
  "summary",
  "clarify",
  "environment-request",
  "desktop-request",
  "terminal-request",
  "feedback-request",
  "mcp-setup",
  "phone-card",
  "mobile-session",
] as const;

/**
 * Spacing above a row in the chat list (`data-slot="chat-stamp"` renders the
 * time when gap is "stamp"). tight: same work run; same: same speaker; turn:
 * speaker change; lead: user message, marker or task report; stamp: a time
 * stamp sits above the row.
 */
export const RowGap = Schema.Struct({
  gap: Schema.Literals(["tight", "same", "turn", "lead", "stamp"]),
  stamp: optional(DateString),
});
