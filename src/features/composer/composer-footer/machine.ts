export type StatusColor =
  | "neutral"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type HandoffDirection = "cloud_to_device" | "device_to_cloud";

export type HandoffState =
  | "capturing"
  | "staged"
  | "provisioning"
  | "restoring"
  | "flipped"
  | "failed"
  | "superseded"
  | "purged";

/** Labels while a thread moves back to the cloud. */
export const toCloudStateLabel: Record<HandoffState, string> = {
  capturing: "Waking",
  staged: "Waking",
  provisioning: "Setting up",
  restoring: "Restoring",
  flipped: "Moved to cloud",
  failed: "Handoff failed",
  superseded: "Superseded",
  purged: "Moved to cloud",
};

/** Labels while a thread moves from the cloud to a device. */
export const toDeviceStateLabel: Record<HandoffState, string> = {
  capturing: "Capturing",
  staged: "Uploaded",
  provisioning: "Preparing device",
  restoring: "Restoring",
  flipped: "Moved to device",
  failed: "Move failed",
  superseded: "Superseded",
  purged: "Moved to device",
};

export type RunningHandoff = {
  id: string;
  direction: HandoffDirection;
  state: HandoffState;
  deviceId: string;
  createdAt: Date;
  failure?: string | null;
};

/** Handoff label shown in the trigger, or null with no handoff running. */
export const handoffLabel = (
  handoff: RunningHandoff | null,
  waitingForSetup: boolean,
) =>
  handoff === null
    ? null
    : waitingForSetup
      ? "Waiting for Setup"
      : (handoff.direction === "cloud_to_device"
          ? toDeviceStateLabel
          : toCloudStateLabel)[handoff.state];

export type FooterDevice = {
  name: string;
  workspaceKind: "worktree" | "checkout";
};

/** The machine trigger's text, from Capy's `MachineTrigger`. */
export const machineTriggerLabel = ({
  device,
  handoff,
  handoffText,
  settingUp,
  detail,
}: {
  device: FooterDevice | null;
  handoff: RunningHandoff | null;
  handoffText: string | null;
  settingUp: boolean;
  detail: string | null;
}) => {
  const towardDevice =
    device !== null && handoff?.direction === "cloud_to_device";
  if (handoffText !== null && towardDevice)
    return `${device.name} · ${handoffText}`;
  if (handoffText !== null) return `Cloud · ${handoffText}`;
  if (device === null) return detail === null ? "Cloud" : `Cloud · ${detail}`;
  return `${device.name} · ${
    settingUp
      ? "Setting up"
      : device.workspaceKind === "worktree"
        ? "Worktree"
        : "Current checkout"
  }`;
};

const bytesPerGb = 1073741824;

/** Gigabytes to one decimal, dropping a trailing .0. */
export const formatGb = (bytes: number) => {
  const rounded = Math.round((bytes / bytesPerGb) * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

export type MachineAllocation = {
  size: string;
  cpuCount: number;
  memoryBytes: number;
  diskBytes: number;
};

export const allocationSummary = (allocation: MachineAllocation) =>
  `${allocation.cpuCount} vCPU · ${formatGb(allocation.memoryBytes)} GB · ${formatGb(allocation.diskBytes)} GB disk`;

export type SetupPhase = "initialize" | "refresh" | "startup";
export type SetupStepStatus =
  | "not_ready"
  | "queued"
  | "running"
  | "success"
  | "error";

export type SetupStep = {
  phase: SetupPhase;
  status: SetupStepStatus;
  repoFullName: string | null;
  startedAt: Date | null;
  durationMs: number | null;
};

export type SetupPhaseSummary = {
  phase: SetupPhase;
  status: SetupStepStatus;
  count: number;
  startedAt: number | null;
  durationMs: number | null;
};

export const setupPhaseLabel: Record<SetupPhase, string> = {
  initialize: "Initialize",
  refresh: "Refresh",
  startup: "Startup",
};

const setupPhases: ReadonlyArray<SetupPhase> = [
  "initialize",
  "refresh",
  "startup",
];

/** Rolls setup steps up into one row per phase, as Capy's `SetupSteps` does. */
export const summarizeSetup = (
  steps: ReadonlyArray<SetupStep>,
): SetupPhaseSummary[] =>
  setupPhases.flatMap((phase) => {
    const inPhase = steps.filter((step) => step.phase === phase);
    if (inPhase.length === 0) return [];
    const running = inPhase.flatMap((step) =>
      step.status === "running" && step.startedAt !== null
        ? [step.startedAt.getTime()]
        : [],
    );
    const status: SetupStepStatus = inPhase.some(
      (step) => step.status === "error",
    )
      ? "error"
      : running.length > 0
        ? "running"
        : inPhase.some((step) => step.status === "running")
          ? "queued"
          : inPhase.some((step) => step.status === "not_ready")
            ? "not_ready"
            : "success";
    const durations = inPhase.flatMap((step) =>
      step.durationMs === null ? [] : [step.durationMs],
    );
    return [
      {
        phase,
        status,
        count:
          phase === "startup"
            ? inPhase.length
            : new Set(inPhase.map((step) => step.repoFullName)).size,
        startedAt: running.length === 0 ? null : Math.min(...running),
        durationMs: durations.length === 0 ? null : Math.max(...durations),
      },
    ];
  });

export const setupPhaseTitle = (summary: SetupPhaseSummary) =>
  summary.count > 1
    ? `${setupPhaseLabel[summary.phase]} · ${summary.count} ${summary.phase === "startup" ? "entries" : "repos"}`
    : setupPhaseLabel[summary.phase];

const msPerSecond = 1e3;

/** Capy's summary duration: seconds under a minute, then minutes and seconds, then hours and minutes. */
export const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const seconds = Math.max(1, Math.ceil(ms / msPerSecond));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

export const formatElapsed = (seconds: number) =>
  seconds === 0 ? `${seconds}s` : formatDuration(seconds * msPerSecond);

export type FooterBranch = {
  repo: string;
  repoFullName: string | null;
  branch: string | null;
};

/** Repo label in the branches menu: the repo name, or "workspace" for the root. */
export const branchRepoLabel = (repo: FooterBranch) =>
  repo.repoFullName === null
    ? repo.repo === "."
      ? "workspace"
      : repo.repo
    : (repo.repoFullName.split("/")[1] ?? repo.repoFullName);

export const branchRows = (repos: ReadonlyArray<FooterBranch>) =>
  repos.flatMap((repo) =>
    repo.branch === null
      ? []
      : [
          {
            key: repo.repo,
            label: branchRepoLabel(repo),
            repoFullName: repo.repoFullName,
            branch: repo.branch,
          },
        ],
  );

export type ResourceSample = {
  cpuUsedPct: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  diskUsedBytes: number | null;
  diskTotalBytes: number | null;
};
