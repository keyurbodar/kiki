import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import { ActorId, ProjectId, Timestamp } from "./ids.ts";
import { ProjectIcon } from "./project.ts";

export const SnapshotState = Schema.Literals([
  "off",
  "building",
  "ready",
  "not_built",
]);
export type SnapshotState = typeof SnapshotState.Type;

export class ProjectSettingsDirectoryEntry extends Schema.Class<ProjectSettingsDirectoryEntry>(
  "ProjectSettingsDirectoryEntry",
)({
  id: ProjectId,
  name: Schema.String,
  nameIsDerived: Schema.Boolean,
  icon: ProjectIcon,
  logoUrl: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  repos: Schema.Array(Schema.String),
  updatedAt: Timestamp,
  setupConfigured: Schema.Boolean,
  setupVersionNumber: Schema.NullOr(Schema.Int),
  snapshotState: SnapshotState,
  sharedVariableCount: Schema.Int,
  personalVariableCount: Schema.Int,
}) {}

export class ProjectSettingsDirectoryPage extends Schema.Class<ProjectSettingsDirectoryPage>(
  "ProjectSettingsDirectoryPage",
)({
  items: Schema.Array(ProjectSettingsDirectoryEntry),
  page: Schema.Int,
  pageCount: Schema.Int,
  totalProjects: Schema.Int,
}) {}

export const SetupPhase = Schema.Literals(["initialize", "refresh"]);
export type SetupPhase = typeof SetupPhase.Type;

export const SetupScripts = Schema.Struct({
  initialize: Schema.NullOr(Schema.String),
  refresh: Schema.NullOr(Schema.String),
});

export const SetupTimeouts = Schema.Struct({
  initialize: Schema.optional(Schema.Int),
  refresh: Schema.optional(Schema.Int),
});

export const SetupEntry = Schema.Struct({
  name: Schema.String,
  command: Schema.String,
  icon: Schema.optional(Schema.String),
  port: Schema.optional(Schema.Int),
  timeout: Schema.optional(Schema.Int),
});
export type SetupEntry = typeof SetupEntry.Type;

export const SetupSource = Schema.Literals(["user", "capy", "repo"]);
export type SetupSource = typeof SetupSource.Type;

export class ProjectSetupRepo extends Schema.Class<ProjectSetupRepo>(
  "ProjectSetupRepo",
)({
  repository: Schema.String,
  branch: Schema.String,
  scripts: SetupScripts,
  timeouts: Schema.optional(SetupTimeouts),
  startup: Schema.Array(SetupEntry),
  commands: Schema.Array(SetupEntry),
  source: SetupSource,
  sourceCommit: Schema.NullOr(Schema.String),
  sourceError: Schema.NullOr(Schema.String),
}) {}

export class ProjectSetup extends Schema.Class<ProjectSetup>("ProjectSetup")({
  machineSize: Schema.String,
  hooks: Schema.NullOr(Schema.Unknown),
  repositories: Schema.Array(ProjectSetupRepo),
  activeVersionId: Schema.NullOr(Schema.String),
  versionNumber: Schema.NullOr(Schema.Int),
}) {}

export const ProjectSetupRepoRequest = Schema.Struct({
  repository: Schema.String,
  branch: Schema.String,
  scripts: SetupScripts,
  timeouts: Schema.optional(SetupTimeouts),
  startup: Schema.Array(SetupEntry),
  commands: Schema.Array(SetupEntry),
});

export const ReplaceProjectSetupRequest = Schema.Struct({
  machineSize: Schema.String,
  hooks: Schema.optional(Schema.Unknown),
  repositories: Schema.Array(ProjectSetupRepoRequest),
  basedOnVersionId: Schema.optional(Schema.NullOr(Schema.String)),
});

export const SnapshotTier = Schema.Literals(["64g", "128g", "256g"]);

export class SnapshotRepoEstimate extends Schema.Class<SnapshotRepoEstimate>(
  "SnapshotRepoEstimate",
)({ repo: Schema.String, sizeKb: Schema.Int }) {}

export class SnapshotEstimate extends Schema.Class<SnapshotEstimate>(
  "SnapshotEstimate",
)({
  withinBudget: Schema.Boolean,
  totalKb: Schema.Int,
  budgetKb: Schema.Int,
  perRepo: Schema.Array(SnapshotRepoEstimate),
}) {}

export class SnapshotTierState extends Schema.Class<SnapshotTierState>(
  "SnapshotTierState",
)({
  tier: SnapshotTier,
  sizes: Schema.Array(Schema.String),
  current: Schema.Boolean,
  artifactCreatedAt: Schema.NullOr(Timestamp),
}) {}

export class SnapshotFreezeFailure extends Schema.Class<SnapshotFreezeFailure>(
  "SnapshotFreezeFailure",
)({ reason: Schema.String, failedAt: Timestamp }) {}

export class ProjectSnapshotConfig extends Schema.Class<ProjectSnapshotConfig>(
  "ProjectSnapshotConfig",
)({
  configured: Schema.Boolean,
  enabled: Schema.Boolean,
  building: Schema.Boolean,
  buildSmallerTiers: Schema.Boolean,
  repos: Schema.Array(Schema.String),
  estimate: Schema.NullOr(SnapshotEstimate),
  hasArtifact: Schema.Boolean,
  tiers: Schema.Array(SnapshotTierState),
  freezeFailure: Schema.optional(Schema.NullOr(SnapshotFreezeFailure)),
}) {}

export const SnapshotBuildTrigger = Schema.Literals([
  "manual",
  "scheduled",
  "test",
  "preflight",
]);
export const SnapshotBuildStatus = Schema.Literals([
  "building",
  "succeeded",
  "failed",
  "cancelled",
]);
export type SnapshotBuildStatus = typeof SnapshotBuildStatus.Type;

export const SnapshotStepStatus = Schema.Literals([
  "running",
  "success",
  "not_ready",
  "error",
]);
export type SnapshotStepStatus = typeof SnapshotStepStatus.Type;

export const SnapshotBuildPhaseName = Schema.Literals([
  "initialize",
  "refresh",
  "startup",
]);

export class SnapshotBuildStep extends Schema.Class<SnapshotBuildStep>(
  "SnapshotBuildStep",
)({
  step: Schema.String,
  status: SnapshotStepStatus,
  durationMs: Schema.NullOr(Schema.Int),
  outputTail: Schema.NullOr(Schema.String),
  errorTail: Schema.NullOr(Schema.String),
}) {}

export class SnapshotBuildPhase extends Schema.Class<SnapshotBuildPhase>(
  "SnapshotBuildPhase",
)({
  repo: Schema.String,
  phase: SnapshotBuildPhaseName,
  entry: Schema.NullOr(Schema.String),
  status: SnapshotStepStatus,
  startedAt: Schema.NullOr(Timestamp),
  durationMs: Schema.NullOr(Schema.Int),
  outputTail: Schema.NullOr(Schema.String),
  errorTail: Schema.NullOr(Schema.String),
}) {}

const snapshotBuildSummaryFields = {
  id: Schema.String,
  trigger: SnapshotBuildTrigger,
  status: SnapshotBuildStatus,
  reason: Schema.NullOr(Schema.String),
  failureReason: Schema.NullOr(Schema.String),
  createdAt: Timestamp,
  startedAt: Schema.NullOr(Timestamp),
  completedAt: Schema.NullOr(Timestamp),
};

export class SnapshotBuildSummary extends Schema.Class<SnapshotBuildSummary>(
  "SnapshotBuildSummary",
)(snapshotBuildSummaryFields) {}

export class SnapshotBuild extends Schema.Class<SnapshotBuild>("SnapshotBuild")(
  {
    ...snapshotBuildSummaryFields,
    steps: Schema.Array(SnapshotBuildStep),
    phases: Schema.Array(SnapshotBuildPhase),
  },
) {}

export const StartSnapshotBuildRequest = Schema.Struct({
  reason: Schema.optional(Schema.String),
  test: Schema.optional(Schema.Boolean),
  ref: Schema.optional(Schema.String),
  repository: Schema.optional(Schema.String),
});

export const EnvironmentVariableName = Schema.String.check(
  Schema.isPattern(/^[A-Za-z_][A-Za-z0-9_]*$/u),
);

export class ProjectEnvironmentVariable extends Schema.Class<ProjectEnvironmentVariable>(
  "ProjectEnvironmentVariable",
)({
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  configured: Schema.Boolean,
  lastModifiedByUserId: Schema.NullOr(ActorId),
  updatedAt: Timestamp,
}) {}

export class ProjectEnvironmentVariableValue extends Schema.Class<ProjectEnvironmentVariableValue>(
  "ProjectEnvironmentVariableValue",
)({ name: Schema.String, value: Schema.String }) {}

export const EnvironmentVariableWrite = Schema.Struct({
  name: EnvironmentVariableName,
  value: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
});

export const SetEnvironmentVariablesRequest = Schema.Struct({
  variables: Schema.Array(EnvironmentVariableWrite),
});

export const SetEnvironmentVariableRequest = Schema.Struct({
  value: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
});

export const DependencyRepoReachability = Schema.Literals([
  "reachable",
  "unreachable",
  "indeterminate",
]);

export class ProjectDependencyRepo extends Schema.Class<ProjectDependencyRepo>(
  "ProjectDependencyRepo",
)({
  repoFullName: Schema.String,
  githubRepoId: Schema.NullOr(Schema.Int),
  installationId: Schema.Int,
  reachability: DependencyRepoReachability,
}) {}

export const ReplaceDependencyReposRequest = Schema.Struct({
  repos: Schema.Array(
    Schema.Struct({
      repoFullName: Schema.String,
      githubRepoId: Schema.NullOr(Schema.Int),
      installationId: Schema.Int,
    }),
  ),
});
