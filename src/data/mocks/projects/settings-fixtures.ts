import { UserId } from "../../api/schemas/ids.ts";
import {
  ProjectDependencyRepo,
  ProjectEnvironmentVariable,
  ProjectSetup,
  ProjectSetupRepo,
  ProjectSnapshotConfig,
  SnapshotBuild,
  SnapshotBuildPhase,
  SnapshotBuildStep,
  SnapshotEstimate,
  SnapshotRepoEstimate,
  SnapshotTierState,
} from "../../api/schemas/project-settings.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people } from "../fixtures/world.ts";

const hour = 60;
const day = 24 * hour;

const setupRepo = (
  repository: string,
  options: {
    readonly initialize?: string | null;
    readonly refresh?: string | null;
    readonly source?: "user" | "capy" | "repo";
    readonly startup?: ProjectSetupRepo["startup"];
    readonly commands?: ProjectSetupRepo["commands"];
  } = {},
) =>
  new ProjectSetupRepo({
    repository,
    branch: "main",
    scripts: {
      initialize: options.initialize ?? null,
      refresh: options.refresh ?? null,
    },
    startup: options.startup ?? [],
    commands: options.commands ?? [],
    source: options.source ?? "user",
    sourceCommit: null,
    sourceError: null,
  });

export const sampleSetups: Record<string, ProjectSetup> = {
  proj_sample_web: new ProjectSetup({
    machineSize: "large",
    hooks: null,
    repositories: [
      setupRepo("acme/web", {
        initialize: "bun install\nbun run build",
        refresh: "bun install",
        source: "capy",
        startup: [{ name: "web", command: "bun run dev", port: 5173 }],
        commands: [
          { name: "test", command: "bun run test" },
          { name: "lint", command: "bun run lint" },
        ],
      }),
    ],
    activeVersionId: "setupver_sample_web_3",
    versionNumber: 3,
  }),
  proj_sample_api: new ProjectSetup({
    machineSize: "medium",
    hooks: null,
    repositories: [
      setupRepo("acme/api", { initialize: "go mod download" }),
      setupRepo("acme/shared"),
    ],
    activeVersionId: "setupver_sample_api_1",
    versionNumber: 1,
  }),
  proj_sample_docs: new ProjectSetup({
    machineSize: "large",
    hooks: null,
    repositories: [setupRepo("acme/docs")],
    activeVersionId: null,
    versionNumber: null,
  }),
};

const estimate = (repos: ReadonlyArray<readonly [string, number]>) =>
  new SnapshotEstimate({
    withinBudget: true,
    totalKb: repos.reduce((sum, [, size]) => sum + size, 0),
    budgetKb: 40 * 1024 * 1024,
    perRepo: repos.map(
      ([repo, sizeKb]) => new SnapshotRepoEstimate({ repo, sizeKb }),
    ),
  });

export const sampleSnapshotConfigs: Record<string, ProjectSnapshotConfig> = {
  proj_sample_web: new ProjectSnapshotConfig({
    configured: true,
    enabled: true,
    building: false,
    buildSmallerTiers: false,
    repos: ["acme/web"],
    estimate: estimate([["acme/web", 1_843_200]]),
    hasArtifact: true,
    tiers: [
      new SnapshotTierState({
        tier: "64g",
        sizes: ["large"],
        current: true,
        artifactCreatedAt: minutesAgo(3 * hour),
      }),
    ],
    freezeFailure: null,
  }),
  proj_sample_api: new ProjectSnapshotConfig({
    configured: true,
    enabled: true,
    building: false,
    buildSmallerTiers: false,
    repos: ["acme/api"],
    estimate: estimate([
      ["acme/api", 512_000],
      ["acme/shared", 96_000],
    ]),
    hasArtifact: false,
    tiers: [
      new SnapshotTierState({
        tier: "64g",
        sizes: ["medium"],
        current: false,
        artifactCreatedAt: null,
      }),
    ],
    freezeFailure: null,
  }),
  proj_sample_docs: new ProjectSnapshotConfig({
    configured: false,
    enabled: false,
    building: false,
    buildSmallerTiers: false,
    repos: [],
    estimate: null,
    hasArtifact: false,
    tiers: [],
    freezeFailure: null,
  }),
};

const step = (
  name: string,
  status: SnapshotBuildStep["status"],
  durationMs: number | null,
  outputTail: string | null = null,
  errorTail: string | null = null,
) =>
  new SnapshotBuildStep({
    step: name,
    status,
    durationMs,
    outputTail,
    errorTail,
  });

const phase = (
  repo: string,
  name: SnapshotBuildPhase["phase"],
  entry: string | null,
  status: SnapshotBuildPhase["status"],
  startedMinutesAgo: number,
  durationMs: number,
  outputTail: string | null = null,
  errorTail: string | null = null,
) =>
  new SnapshotBuildPhase({
    repo,
    phase: name,
    entry,
    status,
    startedAt: minutesAgo(startedMinutesAgo),
    durationMs,
    outputTail,
    errorTail,
  });

export const sampleBuilds: Record<string, ReadonlyArray<SnapshotBuild>> = {
  proj_sample_web: [
    new SnapshotBuild({
      id: "snapbuild_sample_web_3",
      trigger: "scheduled",
      status: "succeeded",
      reason: null,
      failureReason: null,
      createdAt: minutesAgo(3 * hour + 6),
      startedAt: minutesAgo(3 * hour + 5),
      completedAt: minutesAgo(3 * hour),
      steps: [
        step("Boot machine", "success", 21_000),
        step("Clone repositories", "success", 9_400),
        step("Run Setup", "success", 241_000),
        step("Save snapshot", "success", 38_000),
      ],
      phases: [
        phase(
          "acme/web",
          "initialize",
          null,
          "success",
          3 * hour + 4,
          198_000,
          "bun install v1.3.0\n412 packages installed\nvite v7 building for production\n✓ built",
        ),
        phase(
          "acme/web",
          "startup",
          "web",
          "success",
          3 * hour + 1,
          4_200,
          "VITE ready on port 5173",
        ),
      ],
    }),
    new SnapshotBuild({
      id: "snapbuild_sample_web_2",
      trigger: "manual",
      status: "failed",
      reason: "Setup changed",
      failureReason: "initialize exited with code 1",
      createdAt: minutesAgo(2 * day),
      startedAt: minutesAgo(2 * day - 1),
      completedAt: minutesAgo(2 * day - 4),
      steps: [
        step("Boot machine", "success", 19_000),
        step("Clone repositories", "success", 8_800),
        step(
          "Run Setup",
          "error",
          132_000,
          null,
          "error: lockfile had changes, but lockfile is frozen",
        ),
      ],
      phases: [
        phase(
          "acme/web",
          "initialize",
          null,
          "error",
          2 * day - 2,
          132_000,
          "bun install v1.3.0",
          "error: lockfile had changes, but lockfile is frozen",
        ),
      ],
    }),
    new SnapshotBuild({
      id: "snapbuild_sample_web_1",
      trigger: "test",
      status: "succeeded",
      reason: null,
      failureReason: null,
      createdAt: minutesAgo(6 * day),
      startedAt: minutesAgo(6 * day - 1),
      completedAt: minutesAgo(6 * day - 5),
      steps: [
        step("Boot machine", "success", 22_000),
        step("Clone repositories", "success", 9_100),
        step("Run Setup", "success", 205_000),
      ],
      phases: [],
    }),
  ],
  proj_sample_api: [],
  proj_sample_docs: [],
};

const variable = (
  name: string,
  description: string | null,
  updatedMinutesAgo: number,
  by: string = people.alex.id,
) =>
  new ProjectEnvironmentVariable({
    name,
    description,
    configured: true,
    lastModifiedByUserId: UserId.make(by),
    updatedAt: minutesAgo(updatedMinutesAgo),
  });

export const sampleSharedVariables: Record<
  string,
  ReadonlyArray<ProjectEnvironmentVariable>
> = {
  proj_sample_web: [
    variable("DATABASE_URL", "Postgres for local runs and tests", 2 * day),
    variable("STRIPE_SECRET_KEY", null, 5 * day, people.sam.id),
    variable("SENTRY_DSN", "Error reporting from preview builds", 9 * day),
  ],
  proj_sample_api: [variable("REDIS_URL", null, 3 * day, people.priya.id)],
  proj_sample_docs: [],
};

export const samplePersonalVariables: Record<
  string,
  ReadonlyArray<ProjectEnvironmentVariable>
> = {
  proj_sample_web: [
    variable("DATABASE_URL", "My local database", 1 * day),
    variable("GITHUB_TOKEN", null, 4 * day),
  ],
  proj_sample_api: [],
  proj_sample_docs: [],
};

export const sampleVariableValues: Record<string, string> = {
  DATABASE_URL: "postgres://app:app@localhost:5432/app",
  STRIPE_SECRET_KEY: "sk_test_sample",
  SENTRY_DSN: "https://public@sentry.example.com/1",
  REDIS_URL: "redis://localhost:6379",
  GITHUB_TOKEN: "ghp_sample",
};

export const sampleDependencyRepos: Record<
  string,
  ReadonlyArray<ProjectDependencyRepo>
> = {
  proj_sample_web: [
    new ProjectDependencyRepo({
      repoFullName: "acme/design-tokens",
      githubRepoId: 1001,
      installationId: 42,
      reachability: "reachable",
    }),
  ],
  proj_sample_api: [],
  proj_sample_docs: [],
};
