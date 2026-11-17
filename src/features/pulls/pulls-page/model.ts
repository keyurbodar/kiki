import {
  type DateRange,
  dateRangeBounds,
  isCustomDateRange,
  matchesDateRange,
  type SavedView,
} from "@/components/view-toolbar";
import type { PullListRequest } from "./data/atoms";
import { type PullCard, type PullState, repoName } from "./data/pull";

/** Filter axes that can flip to "is not" (Capy's `negativeAxes`). */
export type NegativeAxis =
  | "states"
  | "projects"
  | "repos"
  | "authors"
  | "thread"
  | "created"
  | "updated";

export interface PullFilters {
  readonly states: ReadonlyArray<PullState>;
  readonly projects: ReadonlyArray<string>;
  readonly repos: ReadonlyArray<string>;
  readonly authors: ReadonlyArray<string>;
  readonly labels: ReadonlyArray<string>;
  readonly captains: ReadonlyArray<string>;
  readonly thread: "linked" | "none" | null;
  readonly created: DateRange | null;
  readonly updated: DateRange | null;
  readonly negativeAxes: ReadonlyArray<NegativeAxis>;
}

export type Grouping = "state" | "repo" | "author" | "none";

/** What the page keeps in local storage under `capy-web:pulls-page`. */
export interface PullsPagePrefs {
  readonly filters: PullFilters;
  readonly savedViews: ReadonlyArray<SavedView<PullFilters>>;
  readonly grouping: Grouping;
  readonly showEmptySections: boolean;
  readonly pinned: ReadonlyArray<string>;
  readonly collapsedSections: ReadonlyArray<string>;
  readonly search: string;
  readonly searchOpen: boolean;
}

export const emptyFilters: PullFilters = {
  states: [],
  projects: [],
  repos: [],
  authors: [],
  labels: [],
  captains: [],
  thread: null,
  created: null,
  updated: null,
  negativeAxes: [],
};

export const openStates: ReadonlyArray<PullState> = [
  "ready",
  "pending",
  "failed",
  "draft",
];

export const viewTabs: ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly filters: PullFilters;
}> = [
  {
    key: "open",
    label: "Open",
    filters: { ...emptyFilters, states: openStates },
  },
  {
    key: "ready",
    label: "Ready to merge",
    filters: { ...emptyFilters, states: ["ready"] },
  },
  {
    key: "merged",
    label: "Merged",
    filters: { ...emptyFilters, states: ["merged"] },
  },
  { key: "all", label: "All", filters: emptyFilters },
];

export const defaultPrefs: PullsPagePrefs = {
  filters: { ...emptyFilters, states: openStates },
  savedViews: [],
  grouping: "state",
  showEmptySections: false,
  pinned: [],
  collapsedSections: [],
  search: "",
  searchOpen: false,
};

export const stateOptions: ReadonlyArray<{ value: PullState; label: string }> =
  [
    { value: "ready", label: "Ready" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "draft", label: "Draft" },
    { value: "merged", label: "Merged" },
    { value: "closed", label: "Closed" },
  ];

/** Section order and titles for state grouping. */
export const stateSections: ReadonlyArray<{
  key: PullState;
  label: string;
  history: boolean;
}> = [
  { key: "ready", label: "Ready to merge", history: false },
  { key: "failed", label: "Needs attention", history: false },
  { key: "pending", label: "Waiting on checks", history: false },
  { key: "draft", label: "Draft", history: false },
  { key: "merged", label: "Recently merged", history: true },
  { key: "closed", label: "Recently closed", history: true },
];

export const groupingLabels: Record<Grouping, string> = {
  state: "State",
  repo: "Repository",
  author: "Author",
  none: "No grouping",
};

const usedAxes = (filters: PullFilters) =>
  new Set<NegativeAxis>([
    ...(filters.states.length > 0 ? (["states"] as const) : []),
    ...(filters.projects.length > 0 ? (["projects"] as const) : []),
    ...(filters.repos.length > 0 ? (["repos"] as const) : []),
    ...(filters.authors.length > 0 ? (["authors"] as const) : []),
    ...(filters.thread === null ? [] : (["thread"] as const)),
    ...(filters.created === null ? [] : (["created"] as const)),
    ...(filters.updated === null ? [] : (["updated"] as const)),
  ]);

const filterSignature = (filters: PullFilters) => {
  const used = usedAxes(filters);
  const sorted = <A extends string>(list: ReadonlyArray<A>) => [...list].sort();
  return JSON.stringify({
    ...filters,
    states: sorted(filters.states),
    projects: sorted(filters.projects),
    repos: sorted(filters.repos),
    authors: sorted(filters.authors),
    labels: sorted(filters.labels),
    captains: sorted(filters.captains),
    negativeAxes: sorted(
      [...new Set(filters.negativeAxes)].filter((axis) => used.has(axis)),
    ),
  });
};

export const sameFilters = (a: PullFilters, b: PullFilters) =>
  filterSignature(a) === filterSignature(b);

export const hasFilters = (filters: PullFilters) =>
  usedAxes(filters).size > 0 ||
  filters.labels.length > 0 ||
  filters.captains.length > 0;

/** The built-in tab key or saved view id whose filters match, if any. */
export const activeViewKey = (prefs: PullsPagePrefs) =>
  viewTabs.find((tab) => sameFilters(tab.filters, prefs.filters))?.key ??
  prefs.savedViews.find((view) => sameFilters(view.filters, prefs.filters))?.id;

export const toggle = <A>(list: ReadonlyArray<A>, value: A) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export const isNegative = (filters: PullFilters, axis: NegativeAxis) =>
  filters.negativeAxes.includes(axis);

export const setNegative = (
  filters: PullFilters,
  axis: NegativeAxis,
  negative: boolean,
): PullFilters => ({
  ...filters,
  negativeAxes: negative
    ? [...new Set([...filters.negativeAxes, axis])]
    : filters.negativeAxes.filter((candidate) => candidate !== axis),
});

/** `since` goes to the server as `updatedAfter` when it is a plain lower bound. */
const serverUpdatedAfter = (filters: PullFilters, now: number) => {
  const range = filters.updated;
  if (range === null || isNegative(filters, "updated")) return null;
  if (range === "older" || isCustomDateRange(range)) return null;
  return dateRangeBounds(range, now).after?.getTime() ?? null;
};

/**
 * The request the list endpoint gets for these filters. A search spans every
 * state, matching the Results section, so the tab's state filter is dropped.
 */
export const toListRequest = (
  filters: PullFilters,
  search: string,
  now: number,
  limit: number,
): PullListRequest => {
  const scoped = search === "" ? filters : { ...filters, states: [] };
  const negative = (axis: NegativeAxis) => isNegative(scoped, axis);
  return {
    projectIds: negative("projects") ? [] : scoped.projects,
    excludedProjectIds: negative("projects") ? scoped.projects : [],
    states: negative("states") ? [] : scoped.states,
    excludedStates: negative("states") ? scoped.states : [],
    authors: negative("authors") ? [] : scoped.authors,
    repos: negative("repos") ? [] : scoped.repos,
    labels: scoped.labels,
    captainIds: scoped.captains,
    updatedAfter: serverUpdatedAfter(scoped, now),
    search,
    limit,
  };
};

const listMatches = <A>(
  filters: PullFilters,
  axis: NegativeAxis,
  list: ReadonlyArray<A>,
  value: A,
) => list.length === 0 || list.includes(value) !== isNegative(filters, axis);

/** Applies every filter axis on the client; the server may already have applied some. */
export const matchesFilters = (
  pull: PullCard,
  filters: PullFilters,
  now: number,
) => {
  if (!listMatches(filters, "states", filters.states, pull.state)) return false;
  if (!listMatches(filters, "repos", filters.repos, pull.repo)) return false;
  if (!listMatches(filters, "authors", filters.authors, pull.author)) {
    return false;
  }
  if (filters.projects.length > 0) {
    const inProjects =
      pull.projectId !== null && filters.projects.includes(pull.projectId);
    if (inProjects === isNegative(filters, "projects")) return false;
  }
  if (filters.thread !== null) {
    const linked = pull.threadId !== null;
    if (
      (filters.thread === "linked" ? linked : !linked) ===
      isNegative(filters, "thread")
    ) {
      return false;
    }
  }
  if (
    filters.created !== null &&
    matchesDateRange(new Date(pull.createdAt), filters.created, now) ===
      isNegative(filters, "created")
  ) {
    return false;
  }
  return !(
    filters.updated !== null &&
    matchesDateRange(new Date(pull.updatedAt), filters.updated, now) ===
      isNegative(filters, "updated")
  );
};

export interface PullSection {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<PullCard>;
  readonly showCount: boolean;
}

/** Groups the visible pulls into list sections. */
export const buildSections = (
  pulls: ReadonlyArray<PullCard>,
  prefs: PullsPagePrefs,
  searching: boolean,
  now: number,
): ReadonlyArray<PullSection> => {
  const filters = searching ? { ...prefs.filters, states: [] } : prefs.filters;
  const visible = pulls.filter((pull) => matchesFilters(pull, filters, now));
  if (searching) {
    return visible.length === 0
      ? []
      : [
          {
            id: "results",
            label: "Results",
            members: visible,
            showCount: true,
          },
        ];
  }
  if (prefs.grouping === "repo" || prefs.grouping === "author") {
    const keyOf = (pull: PullCard) =>
      prefs.grouping === "repo" ? pull.repo : pull.author;
    const groups = new Map<string, Array<PullCard>>();
    for (const pull of visible) {
      const key = keyOf(pull);
      groups.set(key, [...(groups.get(key) ?? []), pull]);
    }
    const collides = (key: string) =>
      [...groups.keys()].filter((other) => repoName(other) === repoName(key))
        .length > 1;
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, members]) => ({
        id: `${prefs.grouping}:${key}`,
        label:
          prefs.grouping === "repo"
            ? collides(key)
              ? key
              : repoName(key)
            : key,
        members,
        showCount: true,
      }));
  }
  if (prefs.grouping === "none") {
    return visible.length === 0
      ? []
      : [
          {
            id: "all",
            label: "Pull requests",
            members: visible,
            showCount: true,
          },
        ];
  }
  const pinned = visible.filter((pull) => prefs.pinned.includes(pull.id));
  const rest = visible.filter((pull) => !prefs.pinned.includes(pull.id));
  const pinnedSection =
    pinned.length === 0
      ? []
      : [{ id: "pinned", label: "Pinned", members: pinned, showCount: true }];
  const shownStates = new Set(
    filters.states.length === 0 || isNegative(filters, "states")
      ? stateSections.map((section) => section.key)
      : filters.states,
  );
  const stateGroups = stateSections
    .filter(({ key }) => shownStates.has(key))
    .map(({ key, label, history }) => ({
      id: key,
      label,
      members: rest.filter((pull) => pull.state === key),
      showCount: !history,
    }))
    .filter((section) => section.members.length > 0 || prefs.showEmptySections);
  return [...pinnedSection, ...stateGroups];
};

export const emptyText = (
  searching: boolean,
  total: number,
  filtered: boolean,
  openView = false,
) =>
  searching
    ? "No matching pull requests"
    : total === 0 && !filtered
      ? openView
        ? "No open pull requests"
        : "No pull requests yet"
      : "No pull requests match these filters";

/** Chip value text: up to two names, else "N things". */
export const summarize = (names: ReadonlyArray<string>, noun: string) =>
  names.length <= 2 ? names.join(", ") : `${names.length} ${noun}`;

/** Row code the list prints: a bare `#12`, in a fixed-width column (Capy caps it at 34 px). */
export const pullCode = (pull: PullCard) => `#${pull.number}`;

const minute = 60 * 1000;

/** Minified relative time for list rows: `now`, `5m`, `3h`, `2d`, `4w`, `3mo`, `1y`. */
export const shortAge = (time: number, now: number) => {
  const minutes = Math.max(0, Math.floor((now - time) / minute));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
};
