import { Schema } from "effect";
import {
  AutomationId,
  AutomationRunId,
  ClientId,
  FileId,
  JamId,
  MachineId,
  RequestId,
  ServiceUserId,
  ToolCallId,
  UserId,
} from "./ids";
import { unsupportedTag } from "./unsupported";

const optional = Schema.optional;

/** Who an event is attributed to. */
export const Actor = Schema.Union([
  Schema.Struct({ type: Schema.Literal("user"), userId: UserId }),
  Schema.Struct({
    type: Schema.Literal("service_user"),
    serviceUserId: ServiceUserId,
  }),
  Schema.Struct({
    type: Schema.Literal("system"),
    service: Schema.Literals([
      "github",
      "automation",
      "system",
      "vm",
      "slack",
      "linear",
    ]),
  }),
  Schema.Struct({ type: Schema.Literal("agent"), jamId: JamId }),
]);
export type Actor = typeof Actor.Type;

export const GithubCommentRef = Schema.Struct({
  id: Schema.Number,
  kind: Schema.Literals(["issue", "review"]),
  inReplyToId: optional(Schema.Number),
  path: optional(Schema.String),
  line: optional(Schema.Number),
});

export const AgentRelation = Schema.Union([
  Schema.Struct({ type: Schema.Literal("parent") }),
  Schema.Struct({ type: Schema.Literal("ancestor") }),
  Schema.Struct({
    type: Schema.Literal("peer"),
    address: Schema.String,
    captain: optional(Schema.Literal(true)),
  }),
]);

/** The surface an event arrived from. */
export const Origin = Schema.Union([
  Schema.Struct({ type: Schema.Literal("system") }),
  Schema.Struct({
    type: Schema.Literal("web"),
    userId: optional(UserId),
    authorName: optional(Schema.String),
    slackUserId: optional(Schema.String),
    slackName: optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("api"),
    requestId: RequestId,
    userId: optional(UserId),
    serviceUserId: optional(ServiceUserId),
    authorName: optional(Schema.String),
    slackUserId: optional(Schema.String),
    slackName: optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("slack"),
    teamId: Schema.String,
    channelId: Schema.String,
    messageTs: Schema.String,
    channelName: optional(Schema.String),
    permalink: optional(Schema.String),
    threadTs: optional(Schema.String),
    slackUserId: optional(Schema.String),
    authorName: optional(Schema.String),
    capyUserId: optional(UserId),
    isExternalShared: optional(Schema.Boolean),
  }),
  Schema.Struct({
    type: Schema.Literal("linear"),
    agentSessionId: Schema.String,
    agentActivityId: optional(Schema.String),
    issueIdentifier: optional(Schema.String),
    url: optional(Schema.String),
    userId: optional(UserId),
    authorName: optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("github"),
    deliveryId: Schema.String,
    repoFullName: optional(Schema.String),
    prNumber: optional(Schema.Number),
    authorName: optional(Schema.String),
    comment: optional(GithubCommentRef),
  }),
  Schema.Struct({
    type: Schema.Literal("agent"),
    jamId: JamId,
    relation: AgentRelation,
  }),
  Schema.Struct({
    type: Schema.Literal("automation"),
    automationId: AutomationId,
    automationRunId: optional(AutomationRunId),
  }),
  Schema.Struct({ type: Schema.Literal("vm"), machineId: MachineId }),
]);
export type Origin = typeof Origin.Type;

/** Fields every payload carries. */
export const Attribution = { actor: Actor, origin: Origin };

/** A stored file: attachments, images, documents, clips. */
export const FileRef = Schema.Struct({
  fileId: FileId,
  name: Schema.String,
  mediaType: Schema.String,
  sizeBytes: Schema.Number,
  preview: optional(Schema.Boolean),
  previewBytes: optional(Schema.Number),
  width: optional(Schema.Number),
  height: optional(Schema.Number),
  pageCount: optional(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  ),
  sourcePath: optional(Schema.String),
  contentSha: optional(Schema.String),
  transcript: optional(Schema.String),
});
export type FileRef = typeof FileRef.Type;

export const TitledFile = Schema.Struct({
  file: FileRef,
  title: optional(Schema.String),
});

/** Where a file named in a delivery lives. */
export const FileSource = Schema.Struct({
  ref: Schema.String,
  source: Schema.Union([
    Schema.Struct({
      kind: Schema.Literal("machine"),
      machineId: MachineId,
      path: Schema.String,
    }),
    Schema.Struct({
      kind: Schema.Literal("drive"),
      location: Schema.String,
      path: Schema.String,
    }),
  ]),
});

/** A Capy Drive file a delivery names by reference. */
export const DriveReference = Schema.Struct({
  location: Schema.String,
  path: Schema.String,
  version: Schema.String,
  title: optional(Schema.String),
  sizeBytes: optional(Schema.Number),
  fileId: optional(FileId),
});

/** An inline mention chip inside message text. */
export const Mention = Schema.Struct({
  kind: Schema.Literals([
    "file",
    "thread",
    "pr",
    "skill",
    "secret",
    "excerpt",
    "device",
    "task",
    "slack_channel",
    "user",
  ]),
  id: Schema.String,
  label: Schema.String,
  start: Schema.Number.check(Schema.isInt()),
  end: Schema.Number.check(Schema.isInt()),
  text: Schema.String,
});
export type Mention = typeof Mention.Type;

export const ReasoningMode = Schema.Literals([
  "none",
  "instant",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

export const ModelModes = Schema.Struct({
  fast: optional(Schema.Boolean),
  pro: optional(Schema.Boolean),
  ultrafast: optional(Schema.Boolean),
  daybreak: optional(Schema.Boolean),
});

export const ModelSelection = Schema.Struct({
  modelId: Schema.String,
  reasoningMode: optional(ReasoningMode),
  modes: optional(ModelModes),
}).annotate({ identifier: "ModelSelection" });

const ModelDefaultSource = Schema.Literals([
  "personal",
  "service_user",
  "slack",
  "linear",
  "org",
  "platform",
]);

export const ModelDefault = Schema.Struct({
  source: ModelDefaultSource,
  skipped: Schema.Array(
    Schema.Struct({
      modelId: Schema.String,
      source: ModelDefaultSource,
      reason: Schema.String,
    }),
  ),
}).annotate({ identifier: "ModelDefault" });

/** Client feature flags the server echoes back; unknown flags are dropped. */
export const ClientFeatures = Schema.Array(Schema.String);

export const Delivery = Schema.Literals(["queue", "steer", "interrupt"]);

export const ClientKey = Schema.String.check(Schema.isBetweenLength(1, 64));

export { ClientId };

export const Todo = Schema.Struct({
  content: Schema.String.check(Schema.isMinLength(1)),
  status: Schema.Literals([
    "pending",
    "in_progress",
    "completed",
    "cancelled",
    "deferred",
  ]),
});

const contentBlockMembers = [
  Schema.Struct({ type: Schema.Literal("text"), text: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("image"),
    file: FileRef,
    materialise: optional(Schema.Literal(true)),
  }),
  Schema.Struct({
    type: Schema.Literal("document"),
    file: FileRef,
    materialise: optional(Schema.Literal(true)),
  }),
  Schema.Struct({ type: Schema.Literal("clip"), file: FileRef }),
  Schema.Struct({ type: Schema.Literal("file"), file: FileRef }),
  Schema.Struct({ type: Schema.Literal("json"), data: Schema.Unknown }),
] as const;

/** A tool result block, as stored. */
export const ContentBlock = Schema.Union(contentBlockMembers);
export type ContentBlock = typeof ContentBlock.Type;

/** A tool result block as the events API sends it: unknown types are kept as "unsupported". */
export const WireContentBlock = Schema.Union([
  ...contentBlockMembers,
  unsupportedTag("type", ["text", "image", "document", "clip", "file", "json"]),
]);
export type WireContentBlock = typeof WireContentBlock.Type;

/** A block inside an assistant turn. */
export const AssistantBlock = Schema.Union([
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("text"),
    text: Schema.String,
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("interrupted_reply"),
    text: Schema.String.check(Schema.isMinLength(1)),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("thinking"),
    text: Schema.String,
    presentation: Schema.Literals(["displayed", "summary"]),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("redacted_thinking"),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("image"),
    file: FileRef,
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("tool_use"),
    toolCallId: ToolCallId,
    toolName: Schema.String,
    args: Schema.Unknown,
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("tool_search_use"),
    toolCallId: ToolCallId,
    toolName: Schema.String,
    args: Schema.Unknown,
    providerExecuted: optional(Schema.Boolean),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("tool_search_result"),
    toolCallId: ToolCallId,
    toolName: Schema.String,
    tools: Schema.Array(Schema.String),
    error: optional(
      Schema.Struct({ code: Schema.String, message: Schema.String }),
    ),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("fallback"),
    provider: Schema.String,
    fromModel: optional(Schema.String),
    toModel: optional(Schema.String),
    trigger: optional(
      Schema.Struct({ type: Schema.String, category: optional(Schema.String) }),
    ),
  }),
]);
export type AssistantBlock = typeof AssistantBlock.Type;

/** Lifecycle state of a stored event. */
export const EventState = Schema.Literals([
  "pending",
  "answered",
  "cancelled",
  "failed",
  "committed",
  "abandoned",
  "discarded",
  "promoted",
  "superseded",
]);
export type EventState = typeof EventState.Type;

export const RunStatus = Schema.Literals([
  "working",
  "waiting",
  "idle",
  "done",
  "failed",
]);

export const DeliveryState = Schema.Literals(["working", "final", "needs_you"]);

export const PullState = Schema.Literals([
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
]);
