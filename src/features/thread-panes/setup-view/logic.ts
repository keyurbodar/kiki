export type StatusBucket =
  | "attention"
  | "review"
  | "active"
  | "waiting"
  | "idle";

export type SetupPhase = "initialize" | "refresh";

export type SetupEntry = {
  name: string;
  command: string;
  icon: string | null;
  port: number | null;
  timeout: number | null;
};

export type SetupRepository = {
  repository: string;
  source: string | null;
  branch: string | null;
  scripts: Record<SetupPhase, string | null>;
  timeouts: Partial<Record<SetupPhase, number>>;
  startup: SetupEntry[];
  commands: SetupEntry[];
};

export type LoadedSetup = {
  activeVersionId: string | null;
  machineSize: string;
  repositories: SetupRepository[];
};

export type SetupChange = {
  type: string;
  repository: string | null;
  phase: SetupPhase | null;
  name: string | null;
};

export type SetupVersion = {
  id: string;
  sourceJamId: string | null;
  changes: SetupChange[];
};

export type ThreadChange = { versionId: string; change: SetupChange };

export type ScriptTarget = { repository: string; phase: SetupPhase };

export type SnapshotConfig = { enabled: boolean; hasArtifact: boolean };

export type BuildStatus = "building" | "succeeded" | "failed" | "cancelled";

export type SnapshotBuild = {
  id: string;
  status: BuildStatus;
  trigger: string | null;
  failureReason: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type MachineStepPhase = "initialize" | "refresh" | "startup";

export type MachineStepStatus = "success" | "error" | "not_ready" | "running";

export type MachineSetupStep = {
  repoFullName: string;
  phase: MachineStepPhase;
  entry: string | null;
  status: MachineStepStatus;
  durationMs: number | null;
  startedAt: Date | null;
  tail: string | undefined;
};

export type ThreadMachine = {
  id: string;
  isDevice: boolean;
  state: string;
  setup: { status: string; steps: MachineSetupStep[] };
};

export type SetupStatus = { bucket: StatusBucket; label: string };

export const BUILDS_PREVIEW = 3;
export const SETUP_POLL_INTERVAL = 5e3;
export const SETUP_POLL_INTERVAL_BUILDING = 2e3;

export const scriptPhases: ReadonlyArray<{
  key: SetupPhase;
  label: string;
  defaultTimeout: number;
}> = [
  { key: "initialize", label: "Initialize", defaultTimeout: 900 },
  { key: "refresh", label: "Refresh", defaultTimeout: 300 },
];

export const entryLists = {
  startup: {
    label: "Startup",
    description:
      "Runs on every boot in order, each in its own terminal session, ready when it exits 0 or its port listens",
  },
  commands: {
    label: "Commands",
    description:
      "Launched on demand by name, from the thread or by Capy, each in its own terminal session",
  },
} as const;

export const phaseLabels: Record<MachineStepPhase, string> = {
  initialize: "Initialize",
  refresh: "Refresh",
  startup: "Startup",
};

export const stepBuckets: Record<MachineStepStatus, StatusBucket> = {
  success: "review",
  error: "attention",
  not_ready: "attention",
  running: "active",
};

export const buildStatusLabels: Record<BuildStatus, string> = {
  building: "Building",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const buildStatusBuckets: Record<BuildStatus, StatusBucket> = {
  building: "active",
  succeeded: "review",
  failed: "attention",
  cancelled: "idle",
};

const machineSizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  ultra: "Ultra",
  hyper: "Hyper",
  bigguy: "Big Guy",
};

export const machineSizeLabel = (size: string) =>
  machineSizeLabels[size] ?? size;

export const setupStatus = (
  activeVersionId: string | null,
  snapshotsEnabled: boolean,
  config: SnapshotConfig | undefined,
  latestBuild: SnapshotBuild | undefined,
): SetupStatus => {
  if (activeVersionId === null)
    return { bucket: "idle", label: "No Setup yet" };
  if (latestBuild?.status === "building")
    return { bucket: "active", label: "Snapshot building" };
  if (latestBuild?.status === "failed")
    return { bucket: "attention", label: "Last build failed" };
  if (!snapshotsEnabled) return { bucket: "idle", label: "Snapshots off" };
  return config?.hasArtifact
    ? { bucket: "review", label: "Snapshot ready" }
    : { bucket: "idle", label: "Not built yet" };
};

export const buildTitle = (build: Pick<SnapshotBuild, "trigger">) =>
  build.trigger === "test" || build.trigger === "preflight"
    ? "Test build"
    : "Snapshot build";

export const failureLabel = (reason: string) => {
  const match =
    /^(?:snapshot build step \S+ failed: )?Setup (\w+) failed for (\S+?):/.exec(
      reason,
    );
  if (match === null) return "Build failed";
  const phase = match[1] ?? "";
  const label = phaseLabels[phase as MachineStepPhase] ?? phase;
  return `${label}, ${match[2]}`;
};

export const buildLabel = (
  build: Pick<SnapshotBuild, "status" | "failureReason">,
) =>
  build.status === "failed" && build.failureReason !== null
    ? failureLabel(build.failureReason)
    : build.status === "building"
      ? "Running"
      : buildStatusLabels[build.status];

export const buildDurationMs = (
  build: Pick<SnapshotBuild, "status" | "startedAt" | "completedAt">,
  now: number,
) => {
  const started = build.startedAt?.getTime();
  if (started === undefined) return undefined;
  if (build.completedAt === null)
    return build.status === "building" ? now - started : undefined;
  return build.completedAt.getTime() - started;
};

const second = 1e3;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const total = Math.max(1, Math.ceil(ms / second));
  if (total < 60) return `${total}s`;
  if (total < 3600) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

export const formatAgo = (date: Date, now: number) => {
  const diff = now - date.getTime();
  const abs = Math.abs(diff);
  if (abs < 5 * second) return "just now";
  const amount =
    abs < minute
      ? `${Math.floor(abs / second)}s`
      : abs < hour
        ? `${Math.floor(abs / minute)}m`
        : abs < day
          ? `${Math.floor(abs / hour)}h`
          : abs < week
            ? `${Math.floor(abs / day)}d`
            : abs < year
              ? `${Math.floor(abs / week)}w`
              : `${Math.floor(abs / year)}y`;
  return diff < 0 ? `in ${amount}` : `${amount} ago`;
};

const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export const formatStepTime = (date: Date, now: number) => {
  const today = new Date(now);
  if (date.toDateString() === today.toDateString())
    return clockFormat.format(date);
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday ${clockFormat.format(date)}`;
  return now - date.getTime() < 6 * day
    ? weekdayFormat.format(date)
    : dateFormat.format(date);
};

export const countScripts = (repositories: ReadonlyArray<SetupRepository>) =>
  repositories.reduce(
    (total, repo) => total + Object.values(repo.scripts).filter(Boolean).length,
    0,
  );

export const countStartup = (repositories: ReadonlyArray<SetupRepository>) =>
  repositories.reduce((total, repo) => total + repo.startup.length, 0);

export const countCommands = (repositories: ReadonlyArray<SetupRepository>) =>
  repositories.reduce((total, repo) => total + repo.commands.length, 0);

export const visibleBuilds = <T>(builds: ReadonlyArray<T>, showAll: boolean) =>
  showAll ? builds : builds.slice(0, BUILDS_PREVIEW);

export const hasHiddenBuilds = (
  builds: ReadonlyArray<unknown>,
  showAll: boolean,
) => !showAll && builds.length > BUILDS_PREVIEW;

export const buildsOpenByDefault = (
  builds: ReadonlyArray<Pick<SnapshotBuild, "status">> | undefined,
) => builds?.some((build) => build.status !== "succeeded") ?? false;

export const threadChanges = (
  versions: ReadonlyArray<SetupVersion> | undefined,
  jamId: string,
): ThreadChange[] =>
  (versions ?? [])
    .filter((version) => version.sourceJamId === jamId)
    .flatMap((version) =>
      version.changes.map((change) => ({ versionId: version.id, change })),
    );

const scriptLabel = (phase: SetupPhase | null) =>
  phase === null ? "script" : `${phaseLabels[phase].toLowerCase()} script`;

export const describeChange = (change: SetupChange) => {
  switch (change.type) {
    case "set_script":
      return `Changed ${scriptLabel(change.phase)}`;
    case "remove_script":
      return `Removed ${scriptLabel(change.phase)}`;
    case "set_timeout":
    case "remove_timeout":
      return `Changed ${scriptLabel(change.phase)} timeout`;
    case "set_command":
      return change.name === null
        ? "Changed command"
        : `Changed ${change.name}`;
    case "remove_command":
      return change.name === null
        ? "Removed command"
        : `Removed ${change.name}`;
    case "set_startup":
      return "Changed startup entries";
    default:
      return "Changed Setup";
  }
};

export const changeTarget = (change: SetupChange): ScriptTarget | undefined =>
  change.repository !== null && change.phase !== null
    ? { repository: change.repository, phase: change.phase }
    : undefined;

export const showsMachineSection = (
  machine: ThreadMachine | null | undefined,
): machine is ThreadMachine =>
  machine != null && !machine.isDevice && machine.setup.steps.length > 0;

export const failedStepCount = (steps: ReadonlyArray<MachineSetupStep>) =>
  steps.filter((step) => step.status === "error" || step.status === "not_ready")
    .length;

export const machineSectionCount = (steps: ReadonlyArray<MachineSetupStep>) => {
  const failed = failedStepCount(steps);
  return failed === 0 ? String(steps.length) : `${failed} failed`;
};

export const canRerunSetup = (machine: ThreadMachine) =>
  machine.setup.status === "degraded" && machine.state !== "gone";

export const stepTitle = (step: Pick<MachineSetupStep, "phase" | "entry">) =>
  step.entry === null
    ? phaseLabels[step.phase]
    : `${phaseLabels[step.phase]} ${step.entry}`;

export const stepMeta = (
  step: Pick<MachineSetupStep, "durationMs" | "status" | "startedAt">,
  now: number,
) =>
  [
    step.durationMs === null ? undefined : formatDuration(step.durationMs),
    step.status === "not_ready" ? "not ready" : undefined,
    step.startedAt === null ? undefined : formatStepTime(step.startedAt, now),
  ]
    .filter((part) => part !== undefined)
    .join(" · ");

export const stepKey = (
  step: Pick<MachineSetupStep, "repoFullName" | "phase" | "entry">,
) => `${step.repoFullName}:${step.phase}:${step.entry ?? ""}`;
