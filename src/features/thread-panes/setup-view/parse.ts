import type {
  BuildStatus,
  LoadedSetup,
  MachineSetupStep,
  MachineStepPhase,
  MachineStepStatus,
  SetupChange,
  SetupEntry,
  SetupPhase,
  SetupRepository,
  SetupVersion,
  SnapshotBuild,
  SnapshotConfig,
  ThreadMachine,
} from "./logic";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const record = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const text = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const count = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const date = (value: unknown): Date | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const list = (value: unknown, key?: string): unknown[] => {
  if (Array.isArray(value)) return value;
  if (key !== undefined && isRecord(value) && Array.isArray(value[key]))
    return value[key] as unknown[];
  return [];
};

const isPhase = (value: unknown): value is SetupPhase =>
  value === "initialize" || value === "refresh";

const parseEntry = (value: unknown): SetupEntry | undefined => {
  const entry = record(value);
  const name = text(entry.name);
  if (name === null) return undefined;
  return {
    name,
    command: text(entry.command) ?? "",
    icon: text(entry.icon),
    port: count(entry.port),
    timeout: count(entry.timeout),
  };
};

const parseEntries = (value: unknown) =>
  list(value).flatMap((entry) => parseEntry(entry) ?? []);

const parseRepository = (value: unknown): SetupRepository | undefined => {
  const repo = record(value);
  const repository = text(repo.repository) ?? text(repo.repoFullName);
  if (repository === null) return undefined;
  const scripts = record(repo.scripts);
  const timeouts = record(repo.timeouts);
  const initializeTimeout = count(timeouts.initialize);
  const refreshTimeout = count(timeouts.refresh);
  return {
    repository,
    source: text(repo.source),
    branch: text(repo.branch),
    scripts: {
      initialize: text(scripts.initialize) || null,
      refresh: text(scripts.refresh) || null,
    },
    timeouts: {
      ...(initializeTimeout === null ? {} : { initialize: initializeTimeout }),
      ...(refreshTimeout === null ? {} : { refresh: refreshTimeout }),
    },
    startup: parseEntries(repo.startup),
    commands: parseEntries(repo.commands),
  };
};

export const emptySetup: LoadedSetup = {
  activeVersionId: null,
  machineSize: "medium",
  repositories: [],
};

/** Decodes projects.getSetup; fields the response lacks fall back to an empty Setup. */
export const parseSetup = (value: unknown): LoadedSetup => {
  const setup = record(value);
  return {
    activeVersionId: text(setup.activeVersionId),
    machineSize: text(setup.machineSize) ?? emptySetup.machineSize,
    repositories: list(setup.repositories).flatMap(
      (repo) => parseRepository(repo) ?? [],
    ),
  };
};

const parseChange = (value: unknown): SetupChange | undefined => {
  const change = record(value);
  const type = text(change.type);
  if (type === null) return undefined;
  const entry = record(change.entry);
  return {
    type,
    repository: text(change.repository),
    phase: isPhase(change.phase) ? change.phase : null,
    name: text(change.name) ?? text(entry.name),
  };
};

export const parseSetupVersions = (value: unknown): SetupVersion[] =>
  list(value, "versions").flatMap((item) => {
    const version = record(item);
    const id = text(version.id);
    if (id === null) return [];
    return [
      {
        id,
        sourceJamId: text(version.sourceJamId),
        changes: list(version.changes).flatMap(
          (change) => parseChange(change) ?? [],
        ),
      },
    ];
  });

export const parseSnapshotConfig = (value: unknown): SnapshotConfig => {
  const config = record(value);
  return {
    enabled: config.enabled === true,
    hasArtifact: config.hasArtifact === true,
  };
};

const buildStatuses: ReadonlyArray<BuildStatus> = [
  "building",
  "succeeded",
  "failed",
  "cancelled",
];

export const parseSnapshotBuild = (
  value: unknown,
): SnapshotBuild | undefined => {
  const build = record(value);
  const id = text(build.id);
  const createdAt = date(build.createdAt);
  const status = buildStatuses.find((candidate) => candidate === build.status);
  if (id === null || createdAt === null || status === undefined)
    return undefined;
  return {
    id,
    status,
    trigger: text(build.trigger),
    failureReason: text(build.failureReason),
    createdAt,
    startedAt: date(build.startedAt) ?? createdAt,
    completedAt: date(build.completedAt) ?? date(build.finishedAt),
  };
};

/** Decodes projects.listSnapshotBuilds, newest first as the server sends them. */
export const parseSnapshotBuilds = (value: unknown): SnapshotBuild[] =>
  list(value, "builds").flatMap((build) => parseSnapshotBuild(build) ?? []);

export const parseThreadProjectId = (value: unknown): string | null => {
  const thread = record(value);
  return text(thread.projectId) ?? text(record(thread.project).id);
};

const stepPhases: ReadonlyArray<MachineStepPhase> = [
  "initialize",
  "refresh",
  "startup",
];
const stepStatuses: ReadonlyArray<MachineStepStatus> = [
  "success",
  "error",
  "not_ready",
  "running",
];

const parseStep = (value: unknown): MachineSetupStep | undefined => {
  const step = record(value);
  const repoFullName = text(step.repoFullName);
  const phase = stepPhases.find((candidate) => candidate === step.phase);
  const status = stepStatuses.find((candidate) => candidate === step.status);
  if (repoFullName === null || phase === undefined || status === undefined)
    return undefined;
  return {
    repoFullName,
    phase,
    entry: text(step.entry),
    status,
    durationMs: count(step.durationMs),
    startedAt: date(step.startedAt),
    tail: text(step.tail) ?? undefined,
  };
};

const parseMachine = (value: unknown): ThreadMachine | undefined => {
  const machine = record(value);
  const id = text(machine.id);
  if (id === null) return undefined;
  const setup = record(machine.setup);
  return {
    id,
    isDevice:
      (machine.device !== undefined && machine.device !== null) ||
      machine.kind === "device",
    state: text(machine.state) ?? text(machine.status) ?? "",
    setup: {
      status: text(setup.status) ?? "",
      steps: list(setup.steps).flatMap((step) => parseStep(step) ?? []),
    },
  };
};

/** The thread's current machine from machines.list: the first one listed. */
export const parseThreadMachine = (value: unknown): ThreadMachine | null =>
  parseMachine(list(value, "machines")[0]) ?? null;
