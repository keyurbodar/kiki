import { DateTime } from "effect";
import type { PullListRequest } from "@/data/atoms/pulls";
import type { PullRequestCard, PullState } from "@/data/api/schemas/pull";

/** Filter axes that can flip to "is not" (Capy's `negativeAxes`). */
export type NegativeAxis =
  | "states"
  | "projects"
  | "repos"
  | "authors"
  | "thread"
  | "created"
  | "updated";

export type DatePreset = "today" | "week" | "month" | "quarter" | "older";

export interface PullFilters {
  readonly states: ReadonlyArray<PullState>;
  readonly projects: ReadonlyArray<string>;
  readonly repos: ReadonlyArray<string>;
  readonly authors: ReadonlyArray<string>;
  readonly labels: ReadonlyArray<string>;
  readonly captains: ReadonlyArray<string>;
  readonly thread: "linked" | "none" | null;
  readonly created: DatePreset | null;
  readonly updated: DatePreset | null;
  readonly negativeAxes: ReadonlyArray<NegativeAxis>;
}

export type Grouping = "state" | "repo" | "author" | "none";

export interface SavedView {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly filters: PullFilters;
}

/** What the page keeps in local storage under `capy-web:pulls-page`. */
export interface PullsPagePrefs {
  readonly filters: PullFilters;
  readonly savedViews: ReadonlyArray<SavedView>;
  readonly grouping: Grouping;
  readonly showEmptySections: boolean;
  readonly pinned: ReadonlyArray<string>;
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

export const viewTabs = [
  { key: "open", label: "Open", filters: { ...emptyFilters, states: openStates } },
  {
    key: "ready",
    label: "Ready to merge",
    filters: { ...emptyFilters, states: ["ready"] },
  },
  { key: "merged", label: "Merged", filters: { ...emptyFilters, states: ["merged"] } },
  { key: "all", label: "All", filters: emptyFilters },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  filters: PullFilters;
}>;

export const defaultPrefs: PullsPagePrefs = {
  filters: viewTabs[0].filters,
  savedViews: [],
  grouping: "state",
  showEmptySections: false,
  pinned: [],
  search: "",
  searchOpen: false,
};

export const stateOptions: ReadonlyArray<{ value: PullState; label: string }> = [
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "draft", label: "Draft" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

/** Section order and titles for state grouping (Capy's `mOt`). */
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

const filterSignature = (filters: PullFilters) => {
  const used = new Set<NegativeAxis>([
    ...(filters.states.length > 0 ? (["states"] as const) : []),
    ...(filters.projects.length > 0 ? (["projects"] as const) : []),
    ...(filters.repos.length > 0 ? (["repos"] as const) : []),
    ...(filters.authors.length > 0 ? (["authors"] as const) : []),
    ...(filters.thread === null ? [] : (["thread"] as const)),
    ...(filters.created === null ? [] : (["created"] as const)),
    ...(filters.updated === null ? [] : (["updated"] as const)),
  ]);
  const sorted = <A extends string>(list: ReadonlyArray<A>) => [...list].sort();
  return JSON.stringify({
    ...filters,
    states: sorted(filters.states),
    projects: sorted(filters.projects),
    repos: sorted(filters.repos),
    authors: sorted(filters.authors),
    labels: sorted(filters.labels),
    captains: sorted(filters.captains),
    negativeAxes: sorted([...new Set(filters.negativeAxes)].filter((axis) => used.has(axis))),
  });
};

export const sameFilters = (a: PullFilters, b: PullFilters) =>
  filterSignature(a) === filterSignature(b);

/** The built-in tab key or saved view id whose filters match, if any. */
export const activeViewKey = (prefs: PullsPagePrefs) =>
  viewTabs.find((tab) => sameFilters(tab.filters, prefs.filters))?.key ??
  prefs.savedViews.find((view) => sameFilters(view.filters, prefs.filters))?.id;

export const toggle = <A>(list: ReadonlyArray<A>, value: A) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const dayMs = 24 * 60 * 60 * 1000;
const presetDays: Record<Exclude<DatePreset, "older">, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
};

export const datePresetLabels: Record<DatePreset, string> = {
  today: "Today",
  week: "Past week",
  month: "Past month",
  quarter: "Past 3 months",
  older: "Older",
};

const withinPreset = (time: number, preset: DatePreset, now: number) =>
  preset === "older"
    ? time < now - presetDays.quarter * dayMs
    : time >= now - presetDays[preset] * dayMs;

const serverSideUpdated = (filters: PullFilters) =>
  filters.updated !== null &&
  filters.updated !== "older" &&
  !filters.negativeAxes.includes("updated");

/** The request the list endpoint gets for these filters (Capy's `Rt` input). */
export const toListRequest = (
  filters: PullFilters,
  search: string,
  now: number,
  limit: number,
): PullListRequest => {
  const negative = (axis: NegativeAxis) => filters.negativeAxes.includes(axis);
  return {
    projectIds: negative("projects") ? [] : filters.projects,
    excludedProjectIds: negative("projects") ? filters.projects : [],
    states: negative("states") ? [] : filters.states,
    excludedStates: negative("states") ? filters.states : [],
    authors: negative("authors") ? [] : filters.authors,
    repos: negative("repos") ? [] : filters.repos,
    labels: filters.labels,
    captainIds: filters.captains,
    updatedAfter:
      filters.updated !== null && serverSideUpdated(filters)
        ? now - presetDays[filters.updated as Exclude<DatePreset, "older">] * dayMs
        : null,
    search,
    limit,
  };
};

/** The client-side half of the filters (Capy's `vr`). */
export const matchesFilters = (
  pull: PullRequestCard,
  filters: PullFilters,
  now: number,
) => {
  const negative = (axis: NegativeAxis) => filters.negativeAxes.includes(axis);
  if (
    (filters.states.length > 0 &&
      negative("states") &&
      filters.states.includes(pull.state)) ||
    (filters.repos.length > 0 && negative("repos") && filters.repos.includes(pull.repo)) ||
    (filters.authors.length > 0 &&
      negative("authors") &&
      filters.authors.includes(pull.author))
  ) {
    return false;
  }
  if (filters.thread !== null) {
    const linked = pull.threadId !== null;
    if ((filters.thread === "linked" ? linked : !linked) === negative("thread")) {
      return false;
    }
  }
  if (
    filters.created !== null &&
    withinPreset(DateTime.toEpochMillis(pull.createdAt), filters.created, now) ===
      negative("created")
  ) {
    return false;
  }
  return !(
    filters.updated !== null &&
    !serverSideUpdated(filters) &&
    withinPreset(DateTime.toEpochMillis(pull.updatedAt), filters.updated, now) ===
      negative("updated")
  );
};

export interface PullSection {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<PullRequestCard>;
  readonly showCount: boolean;
}

/** `acme/web` → `web`, as Capy labels repositories. */
export const repoName = (repo: string) => repo.slice(repo.indexOf("/") + 1);

/** Groups the visible pulls into list sections (Capy's PullsPage memo). */
export const buildSections = (
  pulls: ReadonlyArray<PullRequestCard>,
  prefs: PullsPagePrefs,
  searching: boolean,
  now: number,
): ReadonlyArray<PullSection> => {
  const filters = searching ? { ...prefs.filters, states: [] } : prefs.filters;
  const visible = pulls.filter((pull) => matchesFilters(pull, filters, now));
  if (searching) {
    return visible.length === 0
      ? []
      : [{ id: "results", label: "Results", members: visible, showCount: true }];
  }
  if (prefs.grouping === "repo" || prefs.grouping === "author") {
    const keyOf =
      prefs.grouping === "repo"
        ? (pull: PullRequestCard) => repoName(pull.repo)
        : (pull: PullRequestCard) => pull.author;
    const groups = new Map<string, Array<PullRequestCard>>();
    for (const pull of visible) {
      const key = keyOf(pull);
      groups.set(key, [...(groups.get(key) ?? []), pull]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, members]) => ({
        id: `${prefs.grouping}:${key}`,
        label: key,
        members,
        showCount: true,
      }));
  }
  if (prefs.grouping === "none") {
    return visible.length === 0
      ? []
      : [{ id: "all", label: "Pull requests", members: visible, showCount: true }];
  }
  const pinned = visible.filter((pull) => prefs.pinned.includes(pull.id));
  const rest = visible.filter((pull) => !prefs.pinned.includes(pull.id));
  return [
    ...(pinned.length === 0
      ? []
      : [{ id: "pinned", label: "Pinned", members: pinned, showCount: true }]),
    ...stateSections
      .map(({ key, label, history }) => ({
        id: key,
        label,
        members: rest.filter((pull) => pull.state === key),
        showCount: !history,
      }))
      .filter((section) => section.members.length > 0 || prefs.showEmptySections),
  ];
};

export const emptyText = (
  searching: boolean,
  total: number,
  filtered: boolean,
) =>
  searching
    ? "No matching pull requests"
    : total === 0 && !filtered
      ? "No pull requests yet"
      : "No pull requests match these filters";

/** Chip value text: up to two names, else "N things" (Capy's `s`). */
export const summarize = (names: ReadonlyArray<string>, noun: string) =>
  names.length <= 2 ? names.join(", ") : `${names.length} ${noun}`;

/** Row code: `#12`, or `web#12` when the list spans several repos. */
export const pullCode = (pull: PullRequestCard, multirepo: boolean) =>
  multirepo ? `${repoName(pull.repo)}#${pull.number}` : `#${pull.number}`;
