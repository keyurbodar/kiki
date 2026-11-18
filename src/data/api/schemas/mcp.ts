import { Schema } from "effect";
import {
  McpServerId,
  McpSetupId,
  PluginInstallationId,
  ProjectId,
  ToolCallId,
} from "./ids.ts";

export const CompleteMcpOAuthRequest = Schema.Struct({
  state: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512)),
  code: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2048)),
  ),
  iss: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(500)),
  ),
  error: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
  ),
}).annotate({ identifier: "CompleteMcpOAuthRequest" });

export class McpOAuthCompletion extends Schema.Class<McpOAuthCompletion>(
  "McpOAuthCompletion",
)({
  result: Schema.Literals(["connected", "denied", "failed"]),
  destination: Schema.String,
  setupId: Schema.optional(Schema.String),
  desktopScheme: Schema.optional(Schema.String),
}) {}

const NameList = Schema.Array(Schema.String);

const McpOwner = Schema.Literals(["user", "organization"]);

const McpSecretSource = Schema.Union([
  Schema.Struct({ project_env: Schema.String }),
  Schema.Struct({ machine_env: Schema.String }),
  Schema.Struct({ file: Schema.String, key: Schema.String }),
  Schema.Struct({ env_file: Schema.String }),
  Schema.Struct({ value: Schema.String }),
]).annotate({ identifier: "McpSecretSource" });

const McpSecrets = Schema.Record(Schema.String, McpSecretSource);

const McpAuth = Schema.Union([
  Schema.Struct({ type: Schema.Literal("none") }),
  Schema.Struct({
    type: Schema.Literal("headers"),
    credentialHeaderNames: NameList,
  }),
  Schema.Struct({
    type: Schema.Literal("oauth"),
    clientId: Schema.optional(Schema.String),
    clientSecretRequired: Schema.Boolean,
  }),
]).annotate({ identifier: "McpAuth" });

const McpTransport = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("http"),
    url: Schema.String,
    requestHeaderNames: NameList,
    auth: McpAuth,
  }),
  Schema.Struct({
    type: Schema.Literal("stdio"),
    command: Schema.String,
    args: NameList,
    cwd: Schema.optional(Schema.String),
    environmentNames: NameList,
  }),
]).annotate({ identifier: "McpTransport" });

const McpServerConfig = Schema.Struct({
  serverKey: Schema.String,
  displayName: Schema.String,
  projectId: Schema.optional(ProjectId),
  iconUrl: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  privateThreadsOnly: Schema.optional(Schema.Boolean),
  transport: McpTransport,
}).annotate({ identifier: "McpServerConfig" });

const McpPluginSource = Schema.Union([
  Schema.Struct({
    plugin: Schema.String,
    versionId: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    git: Schema.Struct({
      repository: Schema.String,
      ref: Schema.optional(Schema.String),
      path: Schema.optional(Schema.String),
    }),
    versionId: Schema.optional(Schema.String),
  }),
]).annotate({ identifier: "McpPluginSource" });

const McpAddProposal = Schema.Struct({
  kind: Schema.Literal("add"),
  reason: Schema.String,
  owner: Schema.optional(McpOwner),
  server: McpServerConfig,
  secrets: McpSecrets,
  scopes: Schema.optional(NameList),
  disabledTools: Schema.optional(NameList),
});

const McpConnectProposal = Schema.Struct({
  kind: Schema.Literal("connect"),
  reason: Schema.String,
  serverId: McpServerId,
  serverKey: Schema.String,
  displayName: Schema.String,
  projectId: Schema.optional(ProjectId),
  cacheStamp: Schema.String,
  url: Schema.String,
  requestHeaderNames: NameList,
  auth: Schema.Literals(["headers", "oauth"]),
  clientId: Schema.optional(Schema.String),
  hasClientSecret: Schema.Boolean,
  credentialHeaderNames: NameList,
  secrets: McpSecrets,
});

const McpUpdateProposal = Schema.Struct({
  kind: Schema.Literal("update"),
  reason: Schema.String,
  serverId: McpServerId,
  cacheStamp: Schema.String,
  before: McpServerConfig,
  after: McpServerConfig,
  dropsCredentials: Schema.Boolean,
  secrets: McpSecrets,
});

const McpPluginProposal = Schema.Struct({
  kind: Schema.Literal("plugin"),
  reason: Schema.String,
  owner: Schema.optional(McpOwner),
  projectId: Schema.optional(ProjectId),
  source: McpPluginSource,
});

/** The change a setup proposes; Capy derives it from the assistant's tool call. */
export const McpSetupProposal = Schema.Union([
  McpAddProposal,
  McpConnectProposal,
  McpUpdateProposal,
  McpPluginProposal,
]).annotate({ identifier: "McpSetupProposal" });
export type McpSetupProposal = typeof McpSetupProposal.Type;

const McpSetupState = Schema.Literals([
  "pending",
  "declined",
  "completed",
  "changed",
  "private",
]);
export type McpSetupState = typeof McpSetupState.Type;

const McpSetupCurrent = Schema.Literals([
  "pending",
  "declined",
  "added",
  "updated",
  "connected",
  "ready",
  "changed",
  "private",
]);
export type McpSetupCurrent = typeof McpSetupCurrent.Type;

const McpSetupHealthStage = Schema.Literals([
  "connect",
  "auth",
  "permissions",
  "protocol",
  "list",
]);
export type McpSetupHealthStage = typeof McpSetupHealthStage.Type;

/** What the server's last check of the installed server found. `checkedAt` is epoch millis. */
const McpSetupHealth = Schema.Union([
  Schema.Struct({ state: Schema.Literal("unchecked") }),
  Schema.Struct({ state: Schema.Literal("checking") }),
  Schema.Struct({
    state: Schema.Literal("ready"),
    toolCount: Schema.Number,
    excluded: Schema.Number,
    checkedAt: Schema.Number,
  }),
  Schema.Struct({ state: Schema.Literal("empty"), checkedAt: Schema.Number }),
  Schema.Struct({
    state: Schema.Literal("error"),
    stage: McpSetupHealthStage,
    code: Schema.optional(Schema.String),
    detail: Schema.optional(Schema.String),
    requiredScopes: Schema.optional(NameList),
    checkedAt: Schema.Number,
  }),
]).annotate({ identifier: "McpSetupHealth" });
export type McpSetupHealth = typeof McpSetupHealth.Type;

const McpSetupRecovery = Schema.Literals(["none", "automatic", "exhausted"]);
export type McpSetupRecovery = typeof McpSetupRecovery.Type;

export class McpSetupView extends Schema.Class<McpSetupView>("McpSetupView")({
  id: McpSetupId,
  toolCallId: ToolCallId,
  proposal: McpSetupProposal,
  state: McpSetupState,
  current: McpSetupCurrent,
  expired: Schema.Boolean,
  serverId: Schema.optional(McpServerId),
  pluginInstallationId: Schema.optional(Schema.NullOr(PluginInstallationId)),
  owner: Schema.optional(McpOwner),
  toolCount: Schema.optional(Schema.Number),
  health: Schema.optional(McpSetupHealth),
  recovery: McpSetupRecovery,
}) {}
