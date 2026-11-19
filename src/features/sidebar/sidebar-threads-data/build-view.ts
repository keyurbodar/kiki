import type {
  SidebarCaptain,
  SidebarCaptainSort,
  SidebarCollapse,
  SidebarDensity,
  SidebarGrouping,
  SidebarLayout,
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
import {
  defaultThreadFilters,
  filterThreads,
  type ThreadFilters,
  type ThreadListItem,
} from "@/features/threads/threads-page/model";

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
  hidden?: boolean;
  visibility?: "private" | "shared";
  viewerRole?: "owner" | "member" | "none";
  ownerUserId?: string | null;
  members?: ReadonlyArray<{ userId: string }>;
};

export type SourceCaptain = Omit<SidebarCaptain, "age"> & {
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SidebarSource = {
  now: Date;
  /** Nothing has landed yet, so the list shows Capy's `Loading threads` row. */
  loading?: boolean;
  threads: SourceThread[];
  folders: SourceFolder[];
  projects: SidebarProject[];
  captains: SourceCaptain[];
  activeId: string | null;
};

export type SidebarPrefs = {
  mode: SidebarMode;
  layout: SidebarLayout;
  density: SidebarDensity;
  grouping: SidebarGrouping;
  sort: SidebarThreadSort;
  captainSort: SidebarCaptainSort;
  collapse: SidebarCollapse;
  /** Capy's facet filters, on the threads page's own model. */
  filters: ThreadFilters;
  /** The inline `Filter threads` row's text, matched against title and preview. */
  filterText: string;
  open: Record<string, boolean>;
  expanded: Record<string, boolean>;
};

export const defaultSidebarPrefs: SidebarPrefs = {
  mode: "threads",
  layout: "hybrid",
  density: "detailed",
  grouping: "folders",
  sort: "lastActive",
  captainSort: "activity",
  collapse: { working: true, settled: true },
  filters: defaultThreadFilters,
  filterText: "",
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

const toDate = (value: unknown) =>
  value instanceof Date ? value : new Date(String(value));

const matchesFilterText = (thread: SourceThread, text: string) =>
  (thread.title ?? "").toLowerCase().includes(text) ||
  (thread.description ?? "").toLowerCase().includes(text);

/**
 * The sidebar's threads as the threads page's filter model reads them. The
 * fields the card does not carry are the ones Capy's list derives rather than
 * receives (archived idle days, thread number, automation and captain badges),
 * so they arrive empty and the facets that read them are absent from the
 * sidebar's menu.
 */
const toFacetRow = (thread: SourceThread): ThreadListItem => {
  const card = thread.card;
  return {
    id: thread.id,
    title: thread.title,
    status: thread.status,
    archived: thread.archived === true,
    archivedIdleDays: null,
    threadNumber: null,
    userId: card?.userId ?? "",
    participated: card?.participated ?? false,
    origin: thread.origin ?? "web",
    projectId: thread.projectId,
    pinned: thread.pinned === true,
    needsYou: thread.needsYou,
    hasUnreads: thread.hasUnreads,
    personal: card?.personal ?? false,
    lastModelId: card?.lastModelId ?? null,
    pulls: (card?.pulls ?? []).map((pull) => ({
      state: pull.state,
      number: pull.number,
      repo: pull.repo,
    })),
    createdAt: thread.createdAt,
    sortActivityAt:
      card === undefined ? thread.updatedAt : toDate(card.sortActivityAt),
    lastActivityAt: thread.updatedAt,
    settledAt: thread.settled ? thread.updatedAt : null,
    automationName: null,
    automationId: null,
    captain: null,
  };
};

export function buildSidebarThreadsView(
  source: SidebarSource,
  prefs: SidebarPrefs,
): SidebarThreadsView {
  const compare = byNewest(
    prefs.sort === "createdAt" ? "createdAt" : "updatedAt",
  );
  const kept = new Set(
    filterThreads(
      source.threads.map((thread) => toFacetRow(thread)),
      prefs.filters,
      undefined,
      source.now.getTime(),
    ).map((thread) => thread.id),
  );
  const text = prefs.filterText.trim().toLowerCase();
  const live = source.threads.filter(
    (thread) =>
      thread.status !== "archived" &&
      kept.has(thread.id) &&
      (text === "" || matchesFilterText(thread, text)),
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
      /** A folder carries its own order, set by dragging its rows. */
      ordered?: boolean;
      folder?: SourceFolder;
    } = {},
  ) => {
    const sorted =
      options.ordered === true ? threads : threads.toSorted(compare);
    const limit =
      options.limited === false || prefs.expanded[id] === true
        ? sorted.length
        : GROUP_ROW_LIMIT;
    sections.push({
      id,
      kind,
      ...(options.folder === undefined
        ? {}
        : {
            folder: {
              id: options.folder.id,
              name: options.folder.name ?? "Pinned",
              visibility: options.folder.visibility,
              viewerRole: options.folder.viewerRole,
              ownerUserId: options.folder.ownerUserId,
              members: options.folder.members,
              hidden: options.folder.hidden === true,
            },
          }),
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

  const visible = source.folders.filter((folder) => folder.hidden !== true);
  const folders = [
    ...visible.filter((folder) => folder.systemKind === "pinned"),
    ...visible.filter((folder) => folder.systemKind !== "pinned"),
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
      { ordered: true, folder },
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
    layout: prefs.layout,
    density: prefs.density,
    grouping: prefs.grouping,
    sort: prefs.sort,
    captainSort: prefs.captainSort,
    collapse: prefs.collapse,
    filters: prefs.filters,
    filterText: prefs.filterText,
    loading: source.loading === true,
    sections,
    hiddenFolders: source.folders
      .filter((folder) => folder.hidden === true)
      .map((folder) => ({ id: folder.id, name: folder.name ?? "Pinned" })),
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
