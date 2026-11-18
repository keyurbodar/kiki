import type {
  SidebarCaptain,
  SidebarCaptainSort,
  SidebarCollapse,
  SidebarDensity,
  SidebarGrouping,
  SidebarMachine,
  SidebarMode,
  SidebarProject,
  SidebarSection,
  SidebarThread,
  SidebarThreadPreview,
  SidebarThreadSort,
  SidebarThreadsView,
} from "@/components/sidebar-threads";
import type { ThreadRunStatus } from "@/components/thread-status";
import type { ThreadOrigin } from "@/data/api/schemas/thread";

export const GROUP_ROW_LIMIT = 10;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

export const formatAge = (date: Date, now: Date) => {
  const delta = Math.abs(now.getTime() - date.getTime());
  if (delta < 5 * SECOND) return "now";
  if (delta < MINUTE) return `${Math.floor(delta / SECOND)}s`;
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`;
  if (delta < WEEK) return `${Math.floor(delta / DAY)}d`;
  if (delta < YEAR) return `${Math.floor(delta / WEEK)}w`;
  return `${Math.floor(delta / YEAR)}y`;
};

export type SourceThread = {
  id: string;
  title: string | null;
  status: ThreadRunStatus;
  needsYou: boolean;
  ask: string | null;
  hasUnreads: boolean;
  projectId: string | null;
  machine: SidebarMachine | null;
  settled: boolean;
  pinned?: boolean;
  archived?: boolean;
  owner?: boolean;
  /** Where the thread was started, for the sidebar's origin filter. */
  origin?: ThreadOrigin;
  createdAt: Date;
  updatedAt: Date;
} & SidebarThreadPreview;

export type SourceFolder = {
  id: string;
  name: string | null;
  systemKind: "pinned" | null;
  threadIds: string[];
};

export type SourceCaptain = Omit<SidebarCaptain, "age"> & {
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SidebarSource = {
  now: Date;
  threads: SourceThread[];
  folders: SourceFolder[];
  projects: SidebarProject[];
  captains: SourceCaptain[];
  activeId: string | null;
};

export type SidebarPrefs = {
  mode: SidebarMode;
  density: SidebarDensity;
  grouping: SidebarGrouping;
  sort: SidebarThreadSort;
  captainSort: SidebarCaptainSort;
  collapse: SidebarCollapse;
  /** Empty means every origin; otherwise only threads started from these. */
  filterOrigins: ReadonlyArray<ThreadOrigin>;
  open: Record<string, boolean>;
  expanded: Record<string, boolean>;
};

export const defaultSidebarPrefs: SidebarPrefs = {
  mode: "threads",
  density: "detailed",
  grouping: "folders",
  sort: "lastActive",
  captainSort: "activity",
  collapse: { working: true, settled: true },
  filterOrigins: [],
  open: {},
  expanded: {},
};

const byNewest =
  (key: "createdAt" | "updatedAt") =>
  (a: { id: string; createdAt: Date; updatedAt: Date }, b: typeof a) =>
    b[key].getTime() - a[key].getTime() || b.id.localeCompare(a.id);

const toRow = (thread: SourceThread, now: Date): SidebarThread => {
  const {
    createdAt: _createdAt,
    updatedAt,
    pinned = false,
    archived = false,
    owner = false,
    ...row
  } = thread;
  return {
    ...row,
    origin: row.origin ?? "web",
    pinned,
    archived,
    owner,
    age: formatAge(updatedAt, now),
  };
};

export function buildSidebarThreadsView(
  source: SidebarSource,
  prefs: SidebarPrefs,
): SidebarThreadsView {
  const compare = byNewest(
    prefs.sort === "createdAt" ? "createdAt" : "updatedAt",
  );
  const live = source.threads.filter(
    (thread) =>
      thread.status !== "archived" &&
      (prefs.filterOrigins.length === 0 ||
        prefs.filterOrigins.includes(thread.origin ?? "web")),
  );
  const byId = new Map(live.map((thread) => [thread.id, thread]));
  const filed = new Set(source.folders.flatMap((folder) => folder.threadIds));
  const sections: SidebarSection[] = [];

  const push = (
    id: string,
    kind: SidebarSection["kind"],
    label: string,
    threads: SourceThread[],
    options: {
      defaultOpen?: boolean;
      limited?: boolean;
      countAtRest?: boolean;
    } = {},
  ) => {
    const sorted = threads.toSorted(compare);
    const limit =
      options.limited === false || prefs.expanded[id] === true
        ? sorted.length
        : GROUP_ROW_LIMIT;
    sections.push({
      id,
      kind,
      label,
      count: sorted.length,
      countAtRest: options.countAtRest ?? false,
      open: prefs.open[id] ?? options.defaultOpen ?? true,
      threads: sorted
        .slice(0, limit)
        .map((thread) => toRow(thread, source.now)),
      hidden: Math.max(0, sorted.length - limit),
    });
  };

  const folders = [
    ...source.folders.filter((folder) => folder.systemKind === "pinned"),
    ...source.folders.filter((folder) => folder.systemKind !== "pinned"),
  ];
  for (const folder of folders) {
    const members = folder.threadIds.flatMap((id) => {
      const thread = byId.get(id);
      return thread === undefined ? [] : [thread];
    });
    push(
      `folder:${folder.id}`,
      folder.systemKind === "pinned" ? "pinned" : "folder",
      folder.name ?? "Pinned",
      members,
    );
  }

  const loose = live.filter((thread) => !filed.has(thread.id));
  const working = loose.filter(
    (thread) =>
      !thread.settled &&
      (thread.status === "working" || thread.status === "waiting"),
  );
  const settled = loose.filter((thread) => thread.settled);
  const rest = loose.filter(
    (thread) => !working.includes(thread) && !settled.includes(thread),
  );

  if (prefs.grouping === "projects") {
    const projectName = new Map(
      source.projects.map((project) => [project.id, project.name]),
    );
    const groups = new Map<string, SourceThread[]>();
    for (const thread of rest) {
      const key = thread.projectId ?? "none";
      groups.set(key, [...(groups.get(key) ?? []), thread]);
    }
    for (const [projectId, members] of groups) {
      push(
        `project:${projectId}`,
        "project",
        projectName.get(projectId) ?? "No project",
        members,
      );
    }
  } else {
    push("threads:recent", "recent", "Recent", rest);
  }

  push("closed:shelf:working", "working", "Working", working, {
    defaultOpen: !prefs.collapse.working,
    limited: false,
    countAtRest: true,
  });
  push("closed:shelf:settled", "settled", "Settled", settled, {
    defaultOpen: !prefs.collapse.settled,
    limited: false,
    countAtRest: true,
  });

  const captainCompare =
    prefs.captainSort === "drag"
      ? (a: SourceCaptain, b: SourceCaptain) => a.position - b.position
      : byNewest(prefs.captainSort === "createdAt" ? "createdAt" : "updatedAt");

  return {
    mode: prefs.mode,
    density: prefs.density,
    grouping: prefs.grouping,
    sort: prefs.sort,
    captainSort: prefs.captainSort,
    collapse: prefs.collapse,
    filterOrigins: prefs.filterOrigins,
    sections,
    captains: source.captains
      .filter((captain) => captain.status !== "archived")
      .toSorted(captainCompare)
      .map(
        ({
          position: _position,
          createdAt: _createdAt,
          updatedAt,
          ...captain
        }) => ({
          ...captain,
          age: formatAge(updatedAt, source.now),
        }),
      ),
    projects: Object.fromEntries(
      source.projects.map((project) => [project.id, project]),
    ),
    activeId: source.activeId,
  };
}
