import { Schema } from "effect";
import {
  AssistantBlock,
  Attribution,
  ClientFeatures,
  ClientId,
  ClientKey,
  Delivery,
  DeliveryState,
  DriveReference,
  FileRef,
  FileSource,
  Mention,
  ModelDefault,
  ModelSelection,
  PullState,
  ReasoningMode,
  TitledFile,
  Todo,
  WireContentBlock,
} from "./common";
import {
  AutomationId,
  AutomationRunId,
  EventId,
  HandoffId,
  JamId,
  MachineId,
  McpSetupId,
  MobileSessionId,
  OperationId,
  ToolCallId,
  UserId,
} from "./ids";

const optional = Schema.optional;
const Int = Schema.Number.check(Schema.isInt());

// message: a person's (or agent's) chat message

export const MessagePayload = Schema.Struct({
  ...Attribution,
  text: Schema.String,
  files: Schema.Array(FileRef),
  delivery: Delivery,
  clientKey: optional(ClientKey),
  clientId: optional(ClientId),
  model: optional(ModelSelection),
  modelDefault: optional(ModelDefault),
  mentions: optional(Schema.Array(Mention)),
  editOf: optional(EventId),
  retryOf: optional(EventId),
  pullRequestAuthor: optional(Schema.NullOr(Schema.Literals(["user", "capy"]))),
  clientFeatures: optional(ClientFeatures),
});

// control: commands typed into the thread

export const ControlCommand = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("promote_captain"),
    name: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("demote_captain"),
    name: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("rename_captain"),
    from: Schema.String,
    name: Schema.String,
  }),
  Schema.Struct({ type: Schema.Literal("stop") }),
  Schema.Struct({
    type: Schema.Literal("retry"),
    targetEventId: optional(EventId),
  }),
  Schema.Struct({
    type: Schema.Literal("permission_decision"),
    toolCallId: ToolCallId,
    decision: Schema.Literals(["approve", "deny"]),
  }),
  Schema.Struct({
    type: Schema.Literal("cancel_input"),
    targetEventId: EventId,
  }),
  Schema.Struct({ type: Schema.Literal("compact") }),
  Schema.Struct({
    type: Schema.Literal("switch_version"),
    targetEventId: EventId,
  }),
]);

export const ControlPayload = Schema.Struct({
  ...Attribution,
  command: ControlCommand,
});

// notification: platform wakes and notices

/** Every notification key the bundle knows. The schema accepts any string. */
export const NOTIFICATION_KEYS = [
  "auto_cancelled_background_ops",
  "chrome_removed",
  "ci_incomplete",
  "ci_no_checks",
  "ci_result",
  "compact",
  "compaction_failed",
  "connection_changed",
  "credits_answered",
  "credits_waiting",
  "crew_credits_answered",
  "crew_credits_ask",
  "crew.joined",
  "crew.left",
  "crew.released",
  "crew.taken",
  "delivery_reminder",
  "desktop_request_done",
  "desktop_request_expired",
  "drive_bulk_delete",
  "drive_remounted",
  "drive_unmounted",
  "feedback_request_decided",
  "environment_variables_updated",
  "files_copied",
  "github_subscription_event",
  "handoff",
  "input_batch",
  "issue_activity",
  "issues_switched",
  "machine_recovered",
  "machine_secrets_missing",
  "machine_secrets_restored",
  "machine_server_outdated",
  "machine_trouble",
  "machine_unavailable",
  "mcp_setup_updated",
  "permission_decided",
  "phone_attached",
  "pr_closed",
  "pr_conflict",
  "pr_feedback",
  "pr_merged",
  "reasoning_continuation",
  "request_dismissed",
  "request_reopened",
  "review_completion",
  "review_failed",
  "review_submission",
  "setup_failed",
  "setup_recovered",
  "slack_files_dropped",
  "slack_subscription_message",
  "startup_settled",
  "stop_cancelled_ops",
  "subagent_credits_answered",
  "subagent_credits_ask",
  "task_completion",
  "terminal_request_done",
  "thread_completion",
  "unreported_waits",
  "unwaited_background_ops",
  "user_attachment_saved",
  "user_file_saved",
  "volume_conflict",
  "volume_quota",
  "webhook_subscription_request",
  "week_without_check_in",
  "workspace_degraded",
  "workspace_replaced",
  "workspace_restored",
] as const;
export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export const PrFeedback = Schema.Struct({
  repoFullName: Schema.String,
  prNumber: Int,
  author: Schema.String,
  authorAvatarUrl: optional(Schema.String),
  kind: Schema.Literals(["review", "inline_comment", "comment"]),
  state: optional(Schema.String),
  body: optional(Schema.String),
});

export const ConnectionChange = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  state: Schema.Literals(["limit", "capped", "refused", "signed_out"]),
  limit: optional(Schema.String),
  untilMs: optional(Schema.Number),
  retryAtMs: optional(Schema.Number),
});

const CreditsDecision = Schema.Literals(["use", "wait", "reset", "ask"]);

export const FilesCopied = Schema.Struct({
  direction: Schema.Literals(["into", "from"]),
  actorName: Schema.String,
  actorUserId: optional(UserId),
  count: Int,
  kind: Schema.Literals(["file", "directory"]),
  path: Schema.String,
  otherThread: Schema.Struct({ jamId: JamId, code: Schema.String }),
  files: optional(Schema.Array(Schema.String)),
});

export const IssueActivity = Schema.Struct({
  code: Schema.String,
  title: Schema.String,
  actorName: Schema.String,
  actorCode: optional(Schema.String),
  change: Schema.Literals([
    "assigned",
    "status",
    "commented",
    "replied",
    "mentioned",
    "edited",
  ]),
  state: optional(
    Schema.Struct({
      name: Schema.String,
      type: optional(Schema.Literals(["open", "closed"])),
    }),
  ),
  body: optional(Schema.String),
});

export const NotificationPayload = Schema.Struct({
  ...Attribution,
  key: Schema.String,
  summary: Schema.String,
  prFeedback: optional(PrFeedback),
  severity: optional(Schema.Literal("warning")),
  resetsAtMs: optional(Schema.Number),
  connectionChange: optional(ConnectionChange),
  creditsAnsweredBy: optional(UserId),
  creditsDecision: optional(CreditsDecision),
  subagentCredits: optional(
    Schema.Struct({
      childJamId: JamId,
      path: Schema.String,
      standing: Schema.Literals(["open", "waiting", "settled"]),
      decision: optional(CreditsDecision),
      message: optional(Schema.String),
      data: optional(Schema.Unknown),
    }),
  ),
  crewCredits: optional(
    Schema.Struct({
      childJamId: JamId,
      threadCode: Schema.String,
      title: Schema.NullOr(Schema.String),
      standing: Schema.Literals(["open", "settled"]),
      message: optional(Schema.String),
      data: optional(Schema.Unknown),
    }),
  ),
  ref: optional(Schema.Struct({ kind: Schema.String, id: Schema.String })),
  reviewCompletion: optional(Schema.Struct({ prNumber: Int, issues: Int })),
  driveFull: optional(
    Schema.Struct({
      usedBytes: Schema.Number,
      limitBytes: Schema.Number,
      tier: Schema.NullOr(
        Schema.Literals([
          "free",
          "credits",
          "lite",
          "pro",
          "max",
          "enterprise",
        ]),
      ),
    }),
  ),
  driveNotice: optional(Schema.String),
  driveKind: optional(Schema.String),
  environmentVariablesUpdated: optional(
    Schema.Struct({
      action: Schema.Literals(["configured", "removed"]),
      scope: optional(Schema.Literals(["thread", "project"])),
      names: Schema.Array(Schema.String),
    }),
  ),
  issuesSwitched: optional(Schema.Struct({ enabled: Schema.Boolean })),
  mcpSetup: optional(
    Schema.Struct({ setupId: McpSetupId, toolCallId: ToolCallId }),
  ),
  desktopRequest: optional(
    Schema.Struct({
      outcome: Schema.Literals(["done", "expired"]),
      toolCallId: ToolCallId,
    }),
  ),
  feedbackRequest: optional(
    Schema.Struct({
      outcome: Schema.Literals(["sent", "declined"]),
      toolCallId: ToolCallId,
    }),
  ),
  permissionDecided: optional(
    Schema.Struct({
      capability: optional(
        Schema.Literals([
          "device_execution",
          "device_message",
          "computer_use",
          "slack_user_read",
        ]),
      ),
      subject: Schema.String,
      decision: Schema.Literals(["granted", "denied", "revoked"]),
      standing: Schema.Boolean,
      toolCallId: optional(Schema.String),
    }),
  ),
  fileSaved: optional(
    Schema.Struct({ repo: optional(Schema.String), path: Schema.String }),
  ),
  ciResult: optional(
    Schema.Struct({
      pull: Schema.String,
      outcome: Schema.Literals(["passed", "failed"]),
      headSha: optional(Schema.String),
    }),
  ),
  slackMessage: optional(
    Schema.Struct({
      authorName: Schema.String,
      channelId: Schema.String,
      channelName: optional(Schema.String),
      reply: Schema.Boolean,
      text: optional(Schema.String),
    }),
  ),
  filesCopied: optional(FilesCopied),
  setupFailed: optional(Schema.Struct({ repo: optional(Schema.String) })),
  setupFailure: optional(
    Schema.Struct({
      machineId: Schema.String,
      repo: optional(Schema.String),
      phase: optional(Schema.Literals(["initialize", "refresh", "startup"])),
      entry: optional(Schema.String),
      detail: Schema.String,
      retryAtMs: optional(Schema.Number),
      stopped: Schema.Boolean,
    }),
  ),
  setupRecovered: optional(Schema.Struct({ machineId: Schema.String })),
  machineEpisode: optional(
    Schema.Struct({
      machineId: Schema.String,
      cause: optional(Schema.Literals(["start", "reach", "wedged"])),
      capacity: optional(Schema.Boolean),
      sinceMs: optional(Schema.Number),
      restoredToMs: optional(Schema.Number),
      idleDays: optional(Schema.Number),
    }),
  ),
  prTransition: optional(
    Schema.Struct({
      repoFullName: Schema.String,
      prNumber: Int,
      transition: Schema.Literals(["merged", "closed"]),
    }),
  ),
  prConflict: optional(
    Schema.Struct({
      repoFullName: Schema.String,
      prNumber: Int,
      baseRef: Schema.String,
    }),
  ),
  reviewFailed: optional(
    Schema.Struct({
      repoFullName: Schema.String,
      prNumber: Int,
      reason: Schema.String,
    }),
  ),
  githubEvent: optional(
    Schema.Struct({
      repoFullName: Schema.String,
      event: Schema.String,
      subjectTitle: optional(Schema.String),
      branch: optional(Schema.String),
      conclusion: optional(Schema.String),
      permalink: optional(Schema.String),
    }),
  ),
  webhookRequest: optional(Schema.Struct({ description: Schema.String })),
  issueActivity: optional(IssueActivity),
  ciUnsettled: optional(
    Schema.Struct({
      pull: Schema.String,
      headSha: Schema.String,
      state: Schema.Literals(["incomplete", "no_checks", "all_skipped"]),
    }),
  ),
});

// rule: instructions injected into the run

const SkillSummary = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  location: Schema.String,
  source: optional(Schema.String),
  changedAt: optional(Schema.String),
});

export const Rule = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("nested_instruction"),
    source: Schema.String,
    content: Schema.String,
    changedAt: optional(Schema.String),
    repoFullName: optional(Schema.String),
    skills: optional(Schema.Array(SkillSummary)),
  }),
  Schema.Struct({
    type: Schema.Literal("glob_rule"),
    source: Schema.String,
    content: Schema.String,
    changedAt: optional(Schema.String),
    globs: Schema.Array(Schema.String),
    alwaysApply: Schema.Boolean,
    root: optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("review_instructions"),
    requestId: Schema.String,
    headSha: Schema.String,
    files: Schema.Array(
      Schema.Struct({ path: Schema.String, content: Schema.String }),
    ),
  }),
]);

export const RulePayload = Schema.Struct({ ...Attribution, rule: Rule });

// review_request: a PR review run (the events API omits `rules`)

export const ReviewRequestPayload = Schema.Struct({
  ...Attribution,
  repoFullName: Schema.String,
  prNumber: Schema.Number,
  headSha: Schema.String,
  baseSha: Schema.String,
  baseRef: optional(Schema.String),
  rangeFiles: optional(Schema.Number),
  ignorePaths: optional(Schema.Array(Schema.String)),
  trigger: Schema.Literals(["automatic", "manual", "force_refresh"]),
  prompt: optional(Schema.String),
  interruptedHeadSha: optional(Schema.String),
  baselineSha: optional(Schema.String),
  baselineAncestry: optional(Schema.Literals(["ancestor", "rewritten"])),
  baselineBaseSha: optional(Schema.String),
  scopeReason: optional(Schema.Literal("compare_unavailable")),
  baseMoveFiles: optional(Schema.Array(Schema.String)),
  interdiffEmpty: optional(Schema.Boolean),
  priorFindings: optional(
    Schema.Array(
      Schema.Struct({
        id: Schema.String,
        kind: optional(Schema.Literals(["issue", "note"])),
        status: Schema.Literals(["open", "resolved", "irrelevant"]),
        severity: Schema.NullOr(Schema.Literals(["low", "medium", "high"])),
        summary: Schema.String,
        file: Schema.NullOr(Schema.String),
        line: Schema.NullOr(Schema.Number),
      }),
    ),
  ),
});

// task_completion: a subagent finished

export const TaskCompletionPayload = Schema.Struct({
  ...Attribution,
  childJamId: JamId,
  localIndex: Schema.Number,
  outcome: Schema.Literals(["completed", "failed", "stopped"]),
  summary: Schema.String,
  deliveryState: optional(DeliveryState),
  ask: optional(Schema.String),
  finalEventId: optional(EventId),
  attachments: optional(Schema.Array(TitledFile)),
  sources: optional(Schema.Array(FileSource)),
  references: optional(Schema.Array(DriveReference)),
  waitingOn: optional(Schema.Array(Schema.String)),
});

// thread_completion: a crew thread reported to its Captain

export const ThreadCompletionPayload = Schema.Struct({
  ...Attribution,
  childJamId: JamId,
  threadCode: Schema.String,
  title: Schema.NullOr(Schema.String),
  outcome: Schema.Literals(["completed", "failed", "archived"]),
  summary: Schema.String,
  deliveryState: optional(DeliveryState),
  ask: optional(Schema.String),
  needs: optional(Schema.Literals(["captain", "person"])),
  answered: optional(
    Schema.Struct({
      userId: optional(UserId),
      name: optional(Schema.String),
      state: Schema.Literals(["final", "needs_you"]),
      message: Schema.String,
      messageEventId: optional(EventId),
    }),
  ),
  quiet: optional(Schema.Literal(true)),
  personActive: optional(Schema.Boolean),
  waitingOn: optional(Schema.Array(Schema.String)),
  finalEventId: optional(EventId),
  pullRequests: Schema.Array(
    Schema.Struct({
      repoFullName: Schema.String,
      prNumber: Int,
      state: PullState,
    }),
  ),
  attachments: optional(Schema.Array(TitledFile)),
  sources: optional(Schema.Array(FileSource)),
  references: optional(Schema.Array(DriveReference)),
});

// operation_completion: a background command or watch settled

export const OperationCompletionPayload = Schema.Struct({
  ...Attribution,
  operationId: OperationId,
  toolCallId: ToolCallId,
  blocks: Schema.Array(WireContentBlock),
  isError: Schema.Boolean,
  watchEnded: optional(
    Schema.Struct({
      reason: Schema.Literals([
        "superseded",
        "merged",
        "closed",
        "moved",
        "released",
      ]),
      prNumber: optional(Int),
    }),
  ),
  exitCode: optional(Schema.Number),
});

// context: what a thread was started or continued with

const SlackParticipant = Schema.Struct({
  slackUserId: Schema.String,
  slackUsername: optional(Schema.String),
  slackDisplayName: optional(Schema.String),
  slackRealName: optional(Schema.String),
  slackAvatarUrl: optional(Schema.String),
  workspaceId: optional(Schema.String),
  profileWorkspaceId: optional(Schema.String),
  affiliation: optional(Schema.Literals(["internal", "external", "unknown"])),
  isStranger: optional(Schema.Boolean),
  capyUserId: optional(UserId),
  capyUserName: optional(Schema.String),
});

const SlackAttachment = Schema.Struct({
  name: optional(Schema.String),
  mediaType: optional(Schema.String),
  sizeBytes: optional(Schema.Number),
});

const ForwardedMessage = Schema.Struct({
  authorId: optional(Schema.String),
  authorName: optional(Schema.String),
  text: Schema.String,
  fromUrl: optional(Schema.String),
  channelId: optional(Schema.String),
  channelName: optional(Schema.String),
  workspaceId: optional(Schema.String),
  messageTs: optional(Schema.String),
  attachments: Schema.Array(SlackAttachment),
});

const slackMessageFields = {
  ts: Schema.String,
  replyCount: optional(Schema.Number),
  capyResponded: optional(Schema.Boolean),
  text: Schema.String,
  attachments: Schema.Array(SlackAttachment),
  forwardedMessages: Schema.Array(ForwardedMessage),
};

const SlackMessage = Schema.Union([
  Schema.Struct({ ...slackMessageFields, userId: Schema.String }),
  Schema.Struct({ ...slackMessageFields, botName: Schema.String }),
]);

const ForwardedFile = Schema.Struct({
  messageTs: optional(Schema.String),
  file: FileRef,
});

const SlackChannel = Schema.Struct({
  channelId: Schema.String,
  channelName: optional(Schema.String),
  channelType: optional(Schema.String),
  threadTs: optional(Schema.String),
  messageTs: optional(Schema.String),
  isExternalShared: optional(Schema.Boolean),
  workspaceIds: optional(Schema.Array(Schema.String)),
});

export const SideThreadContext = Schema.Struct({
  kind: optional(Schema.Literals(["side_thread", "fork"])),
  mode: optional(Schema.Literals(["copy", "summary"])),
  sourceJamId: JamId,
  sourceTitle: optional(Schema.String),
  participants: Schema.Array(SlackParticipant),
  messages: Schema.Array(SlackMessage),
  forwardedFiles: Schema.Array(ForwardedFile),
});

export const SlackContext = Schema.Struct({
  mode: Schema.Literals(["snapshot", "delta"]),
  channel: SlackChannel,
  source: optional(SlackChannel),
  participants: Schema.Array(SlackParticipant),
  thread: Schema.Struct({
    ts: Schema.String,
    channelId: optional(Schema.String),
    messages: Schema.Array(SlackMessage),
  }),
  forwardedFiles: Schema.Array(ForwardedFile),
}).pipe(Schema.encodeKeys({ forwardedFiles: "forwardedImages" }));

export const LinearContext = Schema.Struct({
  issue: Schema.Struct({
    id: Schema.String,
    identifier: Schema.String,
    title: Schema.String,
    url: Schema.String,
    team: Schema.Struct({
      id: Schema.String,
      key: Schema.String,
      name: Schema.String,
    }),
    description: optional(Schema.String),
    state: optional(Schema.String),
    labels: optional(Schema.Array(Schema.String)),
    parentIdentifier: optional(Schema.String),
    parentTitle: optional(Schema.String),
    projectName: optional(Schema.String),
  }),
  participants: Schema.Array(
    Schema.Struct({
      linearUserId: Schema.String,
      name: optional(Schema.String),
      capyUserId: optional(UserId),
      capyUserName: optional(Schema.String),
    }),
  ),
  comments: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      author: Schema.String,
      body: Schema.String,
      createdAt: optional(Schema.String),
      attachments: Schema.Array(SlackAttachment),
    }),
  ),
  guidance: Schema.Array(
    Schema.Struct({
      body: Schema.String,
      origin: Schema.Literals(["workspace", "team"]),
      teamName: optional(Schema.String),
    }),
  ),
  forwardedFiles: Schema.Array(
    Schema.Struct({ commentId: optional(Schema.String), file: FileRef }),
  ),
});

export const AutomationTrigger = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("webhook_batch"),
    batchId: Schema.String,
    group: Schema.Array(Schema.Unknown),
    reason: Schema.Unknown,
    events: Schema.Array(Schema.Unknown),
    attachmentFileId: optional(Schema.String),
  }),
  Schema.Struct({ kind: Schema.Literal("manual"), at: Schema.String }),
  Schema.Struct({
    kind: Schema.Literal("schedule"),
    occurrence: Schema.String,
  }),
  Schema.Struct({
    kind: Schema.Literal("github"),
    event: Schema.String,
    repoFullName: Schema.String,
    subjectTitle: Schema.String,
    branch: optional(Schema.String),
    conclusion: optional(Schema.String),
    actors: Schema.Array(Schema.String),
    permalink: Schema.String,
    body: Schema.String,
    push: optional(
      Schema.Struct({
        before: Schema.String,
        after: Schema.String,
        compareUrl: Schema.String,
        deleted: Schema.Boolean,
        forced: Schema.Boolean,
        commits: Schema.Array(
          Schema.Struct({
            sha: Schema.String,
            author: Schema.String,
            message: Schema.String,
          }),
        ),
      }),
    ),
  }),
  Schema.Struct({
    kind: Schema.Literal("webhook"),
    body: Schema.String,
    truncated: optional(Int),
  }),
  Schema.Struct({
    kind: Schema.Literal("slack"),
    channelId: Schema.String,
    author: optional(
      Schema.Struct({ slackUserId: Schema.String, capyMember: Schema.Boolean }),
    ),
    reaction: optional(
      Schema.Struct({
        name: Schema.String,
        reactor: Schema.Struct({
          slackUserId: Schema.String,
          capyMember: Schema.Boolean,
        }),
      }),
    ),
    messages: Schema.Array(
      Schema.Struct({ ts: Schema.String, text: Schema.String }),
    ),
    threadTs: optional(Schema.String),
  }),
  Schema.Struct({ kind: Schema.Literal("linear"), facts: Schema.Unknown }),
  Schema.Struct({
    kind: Schema.Literal("source"),
    sourceEventKey: Schema.String,
  }),
]);

export const AutomationContext = Schema.Struct({
  automationId: AutomationId,
  automationRunId: AutomationRunId,
  automationName: Schema.String,
  trigger: AutomationTrigger,
});

export const TakeoverContext = Schema.Struct({
  kind: Schema.Literal("takeover"),
  takerUserId: UserId,
  takerName: optional(Schema.String),
  previousUserId: Schema.String,
  previousUserType: Schema.Literals(["human", "service"]),
  previousName: optional(Schema.String),
});

export const ArchiveContext = Schema.Struct({
  kind: Schema.Literal("archive"),
  reason: Schema.Literal("idle"),
  idleDays: Int,
});

export const ImportContext = Schema.Struct({
  kind: Schema.Literal("import"),
  source: Schema.Literals(["claude-code", "codex", "cursor"]),
  type: Schema.String,
  at: optional(Schema.String),
  body: Schema.Unknown,
});

export const AccessContext = Schema.Struct({
  kind: Schema.Literal("access"),
  change: Schema.Literals([
    "personal",
    "everyone",
    "shared",
    "unshared",
    "owner",
    "transferred",
  ]),
  byUserId: UserId,
  byName: optional(Schema.String),
  userIds: optional(Schema.Array(UserId)),
  names: optional(Schema.Array(Schema.String)),
  container: optional(Schema.Literals(["thread", "captain"])),
});

export const EditContext = Schema.Struct({
  kind: Schema.Literal("edit"),
  operation: Schema.Literals(["edit", "switch"]),
  input: EventId,
  root: EventId,
  live: EventId,
  versions: Schema.Array(EventId),
  supersededMessages: Int,
  supersededTurns: Int,
  restore: optional(
    Schema.Struct({
      trees: Schema.Array(
        Schema.Struct({ path: Schema.String, tree: Schema.String }),
      ),
      restored: Schema.Array(Schema.String),
      notRestored: Schema.Array(Schema.String),
    }),
  ),
  effects: Schema.Array(
    Schema.Struct({
      kind: Schema.Literals([
        "pull",
        "push",
        "task",
        "thread",
        "slack",
        "agent_message",
        "config",
      ]),
      label: Schema.String,
    }),
  ),
});

/** Untagged in the bundle: members are told apart by shape, in this order. */
export const ThreadContext = Schema.Union([
  SideThreadContext,
  SlackContext,
  LinearContext,
  AutomationContext,
  TakeoverContext,
  ArchiveContext,
  ImportContext,
  AccessContext,
  EditContext,
]);

export const ContextPayload = Schema.Struct({
  ...Attribution,
  provider: Schema.Literals(["web", "slack", "linear", "automation", "import"]),
  context: ThreadContext,
  trimmed: optional(Schema.Struct({ droppedMessages: Int })),
});

// assistant: one model turn (server-only notes are not sent to the client)

export const ContextTokens = Schema.Struct({
  system: Schema.Number,
  tools: Schema.Number,
  rules: Schema.Number,
  skills: Schema.Number,
  mcp: Schema.Number,
  environment: Schema.Number,
  conversation: optional(Schema.Number),
});

export const AssistantPayload = Schema.Struct({
  ...Attribution,
  blocks: Schema.Array(AssistantBlock),
  interruption: optional(
    Schema.Struct({
      beforeEventId: EventId,
      exchangeEventId: optional(EventId),
    }),
  ),
  stopReason: Schema.Literals(["tool_use", "end_turn", "refusal", "cancelled"]),
  model: Schema.Struct({
    modelId: Schema.String,
    providerModelId: Schema.String,
    servedModelId: optional(Schema.String),
    reasoningMode: optional(ReasoningMode),
    mode: optional(Schema.Literals(["fast", "pro"])),
    ultrafast: optional(Schema.Literal(true)),
    daybreak: optional(Schema.Literal(true)),
  }),
  route: Schema.Struct({
    source: Schema.Literals(["capy", "oauth", "byok"]),
    providerId: optional(Schema.String),
  }),
  usage: Schema.Struct({
    inputTokens: Schema.Number,
    outputTokens: Schema.Number,
    cacheReadTokens: Schema.Number,
    cacheWriteTokens: Schema.Number,
    reasoningTokens: optional(Schema.Number),
  }),
  contextTokens: optional(ContextTokens),
  wireDropped: optional(
    Schema.Array(
      Schema.Literals(["strict", "custom", "fallbacks", "thinking", "socket"]),
    ),
  ),
  startedAt: optional(Schema.DateFromString),
});

// tool_result: the settled result of a tool call

export const ToolResultPayload = Schema.Struct({
  ...Attribution,
  assistantEventId: optional(EventId),
  toolCallId: ToolCallId,
  blocks: Schema.Array(WireContentBlock),
  isError: Schema.Boolean,
  data: optional(Schema.Unknown),
  reminder: optional(Schema.String),
});

// error

export const ErrorPayload = Schema.Struct({
  ...Attribution,
  code: Schema.String,
  message: Schema.String,
  retryable: Schema.Boolean,
  data: optional(Schema.Unknown),
});

// compact: the conversation was summarised

export const CompactPayload = Schema.Struct({
  ...Attribution,
  summary: Schema.String,
  throughEventId: EventId,
  triggeredBy: Schema.Literals(["auto", "manual"]),
  tokensBefore: optional(Schema.Number),
  model: optional(Schema.NullOr(ModelSelection)),
  todos: optional(Schema.Array(Todo)),
  importSealed: optional(Schema.String),
  computerInterface: optional(Schema.Literal(true)),
  clientFeatures: optional(ClientFeatures),
});

// legacy: events from before the current model

export const LegacyPayload = Schema.Union([
  Schema.Struct({
    ...Attribution,
    legacyType: Schema.String,
    legacyPayload: Schema.Unknown,
  }),
  Schema.Struct({
    ...Attribution,
    archiveRef: Schema.String,
    eventCount: Schema.Number,
  }),
]);

// mobile_session

export const MobileSessionPayload = Schema.Struct({
  ...Attribution,
  sessionId: MobileSessionId,
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

// handoff: the workspace moved between a device and the cloud

const OverCap = Schema.Struct({ path: Schema.String, bytes: Schema.Number });

export const HandoffPayload = Schema.Struct({
  ...Attribution,
  handoffId: HandoffId,
  direction: Schema.Literals(["device_to_cloud", "cloud_to_device"]),
  trigger: Schema.Literals(["user", "failover"]),
  movedByAgent: optional(Schema.Boolean),
  source: Schema.Struct({
    machineId: MachineId,
    deviceName: optional(Schema.String),
    workspaceRoot: Schema.String,
  }),
  destination: optional(
    Schema.Struct({
      machineId: MachineId,
      workspaceRoot: Schema.String,
      deviceName: optional(Schema.String),
      placement: optional(Schema.Literals(["same-folder", "new-worktree"])),
      restoreKind: optional(Schema.Literals(["linked", "worktree"])),
    }),
  ),
  snapshot: Schema.Struct({
    id: Schema.String,
    capturedAt: Schema.Number,
    ageMs: Schema.Number,
  }),
  repos: Schema.Array(
    Schema.Struct({
      dir: Schema.String,
      branch: optional(Schema.String),
      head: Schema.String,
      counts: Schema.Struct({
        staged: Schema.Number,
        unstaged: Schema.Number,
        untracked: Schema.Number,
        ignored: Schema.Number,
        aheadOfBase: Schema.Number,
      }),
      overCap: Schema.Array(OverCap),
    }),
  ),
  overlay: optional(
    Schema.Struct({ files: Schema.Number, overCap: Schema.Array(OverCap) }),
  ),
  outsideRoot: Schema.Literal("not transferred"),
  result: Schema.Union([
    Schema.Struct({
      kind: Schema.Literal("verified"),
      setupFailures: optional(
        Schema.Array(
          Schema.Struct({
            repo: Schema.String,
            phase: Schema.String,
            detail: Schema.String,
          }),
        ),
      ),
    }),
    Schema.Struct({ kind: Schema.Literal("failed"), reason: Schema.String }),
  ]),
});
