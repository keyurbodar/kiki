import { Schema } from "effect";
import { ProjectId, Timestamp, UserId } from "./ids.ts";

export const ConnectionState = Schema.Literals(["active", "auth_required"]);
export const SlackConnectionState = Schema.Literals([
  "active",
  "auth_required",
  "disconnecting",
]);
export const SlackCapability = Schema.Literals(["canvases"]);

export class GitHubUserConnection extends Schema.Class<GitHubUserConnection>(
  "GitHubUserConnection",
)({
  state: Schema.Literals(["connected", "auth_required"]),
  accountLogin: Schema.String,
}) {}

export class GitHubInstallationConnection extends Schema.Class<GitHubInstallationConnection>(
  "GitHubInstallationConnection",
)({
  installationId: Schema.Number,
  state: Schema.Literals(["active", "suspended"]),
}) {}

export class SlackConnection extends Schema.Class<SlackConnection>(
  "SlackConnection",
)({
  id: Schema.String,
  state: SlackConnectionState,
  slackTeamId: Schema.String,
  slackTeamName: Schema.NullOr(Schema.String),
  slackTeamDomain: Schema.NullOr(Schema.String),
  slackTeamIconUrl: Schema.NullOr(Schema.String),
  botUserId: Schema.NullOr(Schema.String),
  grantedScopes: Schema.Array(Schema.String),
  missingScopes: Schema.Array(Schema.String),
  enabledCapabilities: Schema.Array(SlackCapability),
  defaultProjectId: Schema.NullOr(ProjectId),
  defaultBranches: Schema.Record(Schema.String, Schema.String),
  channelProjects: Schema.Record(
    Schema.String,
    Schema.Struct({
      projectId: ProjectId,
      channelName: Schema.optional(Schema.String),
    }),
  ),
  asidePrefix: Schema.NullOr(Schema.String),
  defaultMuted: Schema.Boolean,
  defaultProjectPromptMuted: Schema.Boolean,
  postConfirmations: Schema.Boolean,
  threadLinks: Schema.Boolean,
  connectedByUserId: Schema.NullOr(UserId),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class LinearTeamMapping extends Schema.Class<LinearTeamMapping>(
  "LinearTeamMapping",
)({
  linearTeamId: Schema.String,
  linearTeamName: Schema.NullOr(Schema.String),
  projectId: ProjectId,
}) {}

export class LinearConnection extends Schema.Class<LinearConnection>(
  "LinearConnection",
)({
  id: Schema.String,
  state: ConnectionState,
  linearOrganizationId: Schema.String,
  linearOrganizationName: Schema.NullOr(Schema.String),
  linearLogoUrl: Schema.NullOr(Schema.String),
  appUserId: Schema.NullOr(Schema.String),
  grantedScopes: Schema.Array(Schema.String),
  missingScopes: Schema.Array(Schema.String),
  defaultProjectId: Schema.NullOr(ProjectId),
  defaultBranches: Schema.Record(Schema.String, Schema.String),
  teamMappings: Schema.Array(LinearTeamMapping),
  connectedByUserId: Schema.NullOr(UserId),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class PaperConnection extends Schema.Class<PaperConnection>(
  "PaperConnection",
)({
  state: ConnectionState,
  paperUserId: Schema.String,
  paperEmail: Schema.NullOr(Schema.String),
  paperName: Schema.NullOr(Schema.String),
  grantedScopes: Schema.Array(Schema.String),
  connectedAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class PaperStatus extends Schema.Class<PaperStatus>("PaperStatus")({
  configured: Schema.Boolean,
  connection: Schema.NullOr(PaperConnection),
}) {}

export class TailscaleConnection extends Schema.Class<TailscaleConnection>(
  "TailscaleConnection",
)({
  id: Schema.String,
  state: ConnectionState,
  clientId: Schema.String,
  tag: Schema.String,
  connectedByUserId: Schema.NullOr(UserId),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class IntegrationMutationResult extends Schema.Class<IntegrationMutationResult>(
  "IntegrationMutationResult",
)({ ok: Schema.Literal(true) }) {}

export class GitHubWorkspaceProject extends Schema.Class<GitHubWorkspaceProject>(
  "GitHubWorkspaceProject",
)({ id: ProjectId, name: Schema.String }) {}

export class GitHubWorkspaceInstallation extends Schema.Class<GitHubWorkspaceInstallation>(
  "GitHubWorkspaceInstallation",
)({
  installationId: Schema.Number,
  accountLogin: Schema.NullOr(Schema.String),
  accountType: Schema.NullOr(Schema.String),
  state: Schema.Literals(["active", "suspended", "unavailable"]),
  repositoryCount: Schema.Number,
  manageUrl: Schema.NullOr(Schema.String),
}) {}

export class GitHubWorkspaceRepo extends Schema.Class<GitHubWorkspaceRepo>(
  "GitHubWorkspaceRepo",
)({
  repoFullName: Schema.String,
  accountLogins: Schema.Array(Schema.String),
  projects: Schema.Array(GitHubWorkspaceProject),
}) {}

export class GitHubWorkspaceConnection extends Schema.Class<GitHubWorkspaceConnection>(
  "GitHubWorkspaceConnection",
)({
  installations: Schema.Array(GitHubWorkspaceInstallation),
  repos: Schema.Array(GitHubWorkspaceRepo),
}) {}
