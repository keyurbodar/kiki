import type { PullSort } from "@/components/overview-section";
import type { LocalPull, PullState } from "@/features/thread/local-pull-rows";

export type MachineMark =
  | { kind: "cloud"; size: string | null }
  | { kind: "device"; name: string };

export type OverviewThreadStatus =
  | "idle"
  | "working"
  | "waiting"
  | "needs_you"
  | "done"
  | "failed"
  | "draft"
  | "archived";

export type OverviewTask = {
  id: string;
  parentJamId: string | null;
  relationType: "task" | "side_thread";
  localIndex: number | null;
  title: string | null;
  status: OverviewThreadStatus;
  modelId: string | null;
  machine: MachineMark | null;
  createdAt: Date;
  lastActivityAt: Date | null;
};

export type OverviewModel = { id: string; name: string; provider: string };

export type OverviewPull = {
  id: string;
  jamId: string | null;
  threadId: string;
  number: number;
  url: string;
  repo: string;
  title: string;
  state: PullState;
  baseRef: string;
  headRef: string;
  additions: number;
  deletions: number;
  createdAt: Date;
};

export type OverviewTodo = {
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "deferred";
};

export type OverviewPort = {
  machineId: string;
  port: number;
  title: string;
};

export type OverviewTab =
  | { kind: "diffs" }
  | { kind: "files" }
  | { kind: "desktop"; jamId: string; localIndex: null }
  | { kind: "shell"; machineId: string | null }
  | { kind: "preview"; machineId: string; port: number };

export type OverviewRepoStatus = {
  repo: string;
  repoFullName: string | null;
  dirtyCount: number | null;
  ahead: number;
};

export type OverviewTurn = {
  fileCount: number;
  additions: number;
  deletions: number;
};

export type OverviewMachine = {
  machineId: string;
  state: "creating" | "waking" | "awake" | "wind_down" | "asleep" | "gone";
  device: boolean;
  unfunded?: boolean;
  allocation: { cpuCount: number; memoryBytes: number } | null;
};

export type OverviewData = {
  jamId: string;
  tasks: ReadonlyArray<OverviewTask>;
  todos: ReadonlyArray<OverviewTodo> | null;
  pulls: ReadonlyArray<OverviewPull> | undefined;
  localPulls: ReadonlyArray<LocalPull>;
  ports: ReadonlyArray<OverviewPort>;
  models: ReadonlyArray<OverviewModel>;
  totalTasks?: number;
};

export type OverviewSurfaces = {
  repos: ReadonlyArray<OverviewRepoStatus>;
  turns: ReadonlyArray<OverviewTurn>;
  machine: OverviewMachine | null;
  sessions: ReadonlyArray<string> | undefined;
};

export const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

export function relativeTime(
  date: Date | number,
  options?: { now?: number; minified?: boolean },
) {
  const delta =
    (options?.now ?? Date.now()) -
    (typeof date === "number" ? date : date.getTime());
  const minified = options?.minified === true;
  const abs = Math.abs(delta);
  if (abs < 5 * SECOND) return minified ? "now" : "just now";
  const short =
    abs < MINUTE
      ? `${Math.floor(abs / SECOND)}s`
      : abs < HOUR
        ? `${Math.floor(abs / MINUTE)}m`
        : abs < DAY
          ? `${Math.floor(abs / HOUR)}h`
          : abs < WEEK
            ? `${Math.floor(abs / DAY)}d`
            : abs < YEAR
              ? `${Math.floor(abs / WEEK)}w`
              : `${Math.floor(abs / YEAR)}y`;
  return minified ? short : delta < 0 ? `in ${short}` : `${short} ago`;
}

export const childTasks = (
  subtree: ReadonlyArray<OverviewTask>,
  parentId: string,
) =>
  subtree
    .filter(
      (task) => task.parentJamId === parentId && task.relationType === "task",
    )
    .sort((a, b) => (b.localIndex ?? 0) - (a.localIndex ?? 0));

export const sideThreads = (
  subtree: ReadonlyArray<OverviewTask>,
  parentId: string,
) =>
  subtree.filter(
    (task) =>
      task.parentJamId === parentId && task.relationType === "side_thread",
  );

export const childPath = (parentPath: string, localIndex: number | null) =>
  localIndex === null
    ? ""
    : `${parentPath === "" ? "" : `${parentPath}.`}${localIndex}`;

export function subagentPaths(
  subtree: ReadonlyArray<OverviewTask>,
  rootId: string,
) {
  const paths = new Map<string, string>();
  const walk = (parentId: string, prefix: string) => {
    for (const task of subtree) {
      if (task.parentJamId !== parentId || task.relationType !== "task")
        continue;
      if (task.localIndex === null) {
        walk(task.id, prefix);
        continue;
      }
      const path = `${prefix}${task.localIndex}`;
      paths.set(task.id, path);
      walk(task.id, `${path}.`);
    }
  };
  walk(rootId, "");
  return paths;
}

export const pullVia = (
  pull: Pick<OverviewPull, "jamId">,
  jamId: string,
  paths: ReadonlyMap<string, string>,
) => {
  if (pull.jamId === null || pull.jamId === jamId) return undefined;
  const path = paths.get(pull.jamId);
  return path === undefined ? undefined : `via Subagent ${path}`;
};

export const PULL_SORT_GROUPS: ReadonlyArray<
  ReadonlyArray<{ value: PullSort; label: string }>
> = [
  [
    { value: "updated", label: "Recently updated" },
    { value: "opened", label: "Recently opened" },
  ],
  [
    { value: "largest", label: "Largest diff" },
    { value: "smallest", label: "Smallest diff" },
  ],
  [
    { value: "status", label: "Status" },
    { value: "repo", label: "Repository" },
  ],
];

const PULL_STATE_ORDER: ReadonlyArray<PullState> = [
  "ready",
  "failed",
  "pending",
  "draft",
  "merged",
  "closed",
];

const diffSize = (pull: OverviewPull) => pull.additions + pull.deletions;
const stateRank = (pull: OverviewPull) => PULL_STATE_ORDER.indexOf(pull.state);

export const pullComparator =
  (sort: PullSort) => (a: OverviewPull, b: OverviewPull) => {
    switch (sort) {
      case "updated":
        return 0;
      case "opened":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "largest":
        return diffSize(b) - diffSize(a);
      case "smallest":
        return diffSize(a) - diffSize(b);
      case "repo":
        return a.repo.localeCompare(b.repo);
      case "status":
        return stateRank(a) - stateRank(b);
    }
  };

export const sortPulls = (pulls: ReadonlyArray<OverviewPull>, sort: PullSort) =>
  pulls.toSorted(pullComparator(sort));

export const hasOverviewContent = (input: {
  todos: ReadonlyArray<OverviewTodo> | null;
  tasks: ReadonlyArray<OverviewTask>;
  pulls: ReadonlyArray<OverviewPull> | undefined;
  locals: ReadonlyArray<LocalPull>;
  ports: ReadonlyArray<OverviewPort>;
  sideThreads: ReadonlyArray<OverviewTask>;
}) =>
  (input.todos !== null && input.todos.length > 0) ||
  input.tasks.length > 0 ||
  (input.pulls !== undefined && input.pulls.length > 0) ||
  input.locals.length > 0 ||
  input.ports.length > 0 ||
  input.sideThreads.length > 0;

export const todoProgress = (todos: ReadonlyArray<OverviewTodo>) =>
  `${todos.filter((todo) => todo.status === "completed").length}/${todos.length}`;

export const machineMarkLabel = (machine: MachineMark) =>
  machine.kind === "device"
    ? `Paired device · ${machine.name}`
    : machine.size === null
      ? "Cloud · Size unavailable"
      : `Cloud · ${machine.size[0]?.toUpperCase()}${machine.size.slice(1)}`;

export const machineStateLabel = (
  machine: OverviewMachine,
  restarting = false,
) => {
  switch (machine.state) {
    case "creating":
    case "waking":
      return "Waking";
    case "awake":
    case "wind_down":
      return "Awake";
    case "asleep":
      return "Asleep";
    case "gone":
      return machine.unfunded === true
        ? "Out of credits"
        : restarting
          ? "Restarting"
          : "Stopped";
  }
};

export const machineStateColor = (
  machine: OverviewMachine,
  restarting = false,
) =>
  machine.state === "awake" || machine.state === "wind_down"
    ? "success"
    : machine.state === "gone" && (!restarting || machine.unfunded === true)
      ? "danger"
      : "neutral";

const GIB = 1024 * 1024 * 1024;

export const allocationLabel = (machine: OverviewMachine | null) =>
  machine?.allocation == null
    ? undefined
    : `${machine.allocation.cpuCount} vCPU · ${Math.round(machine.allocation.memoryBytes / GIB)} GB`;

export const repoLabel = (repo: OverviewRepoStatus) =>
  repo.repoFullName === null
    ? repo.repo === "."
      ? "root"
      : (repo.repo.split("/").at(-1) ?? repo.repo)
    : (repo.repoFullName.split("/")[1] ?? repo.repoFullName);

export function diffsSummary(
  repos: ReadonlyArray<OverviewRepoStatus>,
  turns: ReadonlyArray<OverviewTurn>,
) {
  const dirty = repos.reduce((sum, repo) => sum + (repo.dirtyCount ?? 0), 0);
  const ahead = repos.reduce((sum, repo) => sum + repo.ahead, 0);
  const files = turns.reduce((sum, turn) => sum + turn.fileCount, 0);
  const parts = [
    turns.length > 0 &&
      `${pluralize(files, "file")} · ${pluralize(turns.length, "turn")}`,
    dirty > 0 && `${dirty} dirty`,
    ahead > 0 && `${ahead} ahead`,
  ].filter((part): part is string => part !== false);
  const detail = parts.join(" · ");
  return {
    detail: detail === "" ? "No changes yet" : detail,
    additions: turns.reduce((sum, turn) => sum + turn.additions, 0),
    deletions: turns.reduce((sum, turn) => sum + turn.deletions, 0),
    hasTurns: turns.length > 0,
  };
}
