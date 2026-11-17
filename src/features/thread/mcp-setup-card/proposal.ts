import { Option, Schema } from "effect";

const NameList = Schema.Array(Schema.String);

export const McpSecretSource = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("visible"), value: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("project_env"), name: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("machine_env"), name: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("env_file"), path: Schema.String }),
  Schema.Struct({
    kind: Schema.Literal("file"),
    path: Schema.String,
    key: Schema.String,
  }),
]);
export type McpSecretSource = typeof McpSecretSource.Type;

export const McpSecrets = Schema.Record(Schema.String, McpSecretSource);
export type McpSecrets = typeof McpSecrets.Type;

export const McpAuth = Schema.Struct({
  type: Schema.Literals(["none", "headers", "oauth"]),
  credentialHeaderNames: NameList,
  clientId: Schema.NullOr(Schema.String),
  clientSecretRequired: Schema.Boolean,
});
export type McpAuth = typeof McpAuth.Type;

export const McpTransport = Schema.Union([
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
    cwd: Schema.NullOr(Schema.String),
    environmentNames: NameList,
  }),
]);
export type McpTransport = typeof McpTransport.Type;

export const McpServerConfig = Schema.Struct({
  serverKey: Schema.String,
  displayName: Schema.String,
  iconUrl: Schema.NullOr(Schema.String),
  projectId: Schema.NullOr(Schema.String),
  enabled: Schema.Boolean,
  privateThreadsOnly: Schema.optional(Schema.Boolean),
  transport: McpTransport,
});
export type McpServerConfig = typeof McpServerConfig.Type;

const Owner = Schema.optional(Schema.Literals(["user", "organization"]));
const Project = Schema.Literals(["current", "all"]);

export const McpAddProposal = Schema.Struct({
  kind: Schema.Literal("add"),
  reason: Schema.String,
  project: Project,
  owner: Owner,
  secrets: McpSecrets,
  server: Schema.Struct({
    serverKey: Schema.String,
    displayName: Schema.String,
    iconUrl: Schema.NullOr(Schema.String),
    projectId: Schema.optional(Schema.NullOr(Schema.String)),
    transport: McpTransport,
  }),
});

export const McpUpdateProposal = Schema.Struct({
  kind: Schema.Literal("update"),
  reason: Schema.String,
  serverId: Schema.String,
  cacheStamp: Schema.String,
  before: McpServerConfig,
  after: McpServerConfig,
  dropsCredentials: Schema.Boolean,
  secrets: McpSecrets,
});

export const McpConnectProposal = Schema.Struct({
  kind: Schema.Literal("connect"),
  reason: Schema.String,
  serverId: Schema.String,
  cacheStamp: Schema.String,
  secrets: McpSecrets,
  server: McpServerConfig,
});

export const McpPluginSource = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("marketplace"),
    name: Schema.String,
    versionId: Schema.String,
  }),
  Schema.Struct({
    kind: Schema.Literal("git"),
    repository: Schema.String,
    ref: Schema.optional(Schema.String),
    path: Schema.optional(Schema.String),
    versionId: Schema.optional(Schema.String),
  }),
]);
export type McpPluginSource = typeof McpPluginSource.Type;

export const McpPluginProposal = Schema.Struct({
  kind: Schema.Literal("plugin"),
  reason: Schema.String,
  project: Project,
  owner: Owner,
  projectId: Schema.optional(Schema.NullOr(Schema.String)),
  source: McpPluginSource,
});

export const McpServerProposal = Schema.Union([
  McpAddProposal,
  McpUpdateProposal,
  McpConnectProposal,
]);
export type McpServerProposal = typeof McpServerProposal.Type;
export type McpAddProposal = typeof McpAddProposal.Type;
export type McpUpdateProposal = typeof McpUpdateProposal.Type;
export type McpConnectProposal = typeof McpConnectProposal.Type;
export type McpPluginProposal = typeof McpPluginProposal.Type;

export const McpSetupProposal = Schema.Union([
  McpAddProposal,
  McpUpdateProposal,
  McpConnectProposal,
  McpPluginProposal,
]);
export type McpSetupProposal = typeof McpSetupProposal.Type;

const decodeOption = Schema.decodeUnknownOption(McpSetupProposal);

export const decodeProposal = (input: unknown): McpSetupProposal | undefined =>
  Option.getOrUndefined(decodeOption(input));
