import type { FilterChipModel } from "@/components/view-toolbar";
import {
  type DateRange,
  filterOperatorLabel,
  matchesDateRange,
} from "@/components/view-toolbar";

/** A thread as the list draws it; mapped from the jams list ThreadCard. */
export type ThreadListItem = {
  readonly id: string;
  readonly title: string | null;
  readonly status: "working" | "waiting" | "idle" | "failed" | "archived";
  readonly archived: boolean;
  readonly archivedIdleDays: number | null;
  readonly threadNumber: number | null;
  readonly userId: string;
  readonly participated: boolean;
  readonly origin: string;
  readonly projectId: string | null;
  readonly pinned: boolean;
  readonly needsYou: boolean;
  readonly hasUnreads: boolean;
  readonly personal: boolean;
  readonly lastModelId: string | null;
  readonly pulls: ReadonlyArray<{
    readonly state: string;
    readonly number: number;
    readonly repo: string;
  }>;
  readonly createdAt: Date;
  readonly sortActivityAt: Date;
  readonly lastActivityAt: Date | null;
  readonly settledAt: Date | null;
  readonly automationName: string | null;
  readonly automationId: string | null;
  readonly captain: {
    readonly name: string;
    readonly avatarUrl: string | null;
  } | null;
};

export type ProjectSummary = {
  readonly id: string;
  readonly name: string;
  readonly code: string;
};

export type ThreadFilters = {
  readonly projects: ReadonlyArray<string>;
  /** null means "me" (the viewer), [] means everyone. */
  readonly participants: ReadonlyArray<string> | null;
  readonly authors: ReadonlyArray<string>;
  readonly statuses: ReadonlyArray<string>;
  readonly origins: ReadonlyArray<string>;
  readonly automations: ReadonlyArray<string>;
  readonly models: ReadonlyArray<string>;
  readonly prStates: ReadonlyArray<string>;
  readonly created: DateRange | null;
  readonly updated: DateRange | null;
  readonly archived: "exclude" | "only";
  readonly negativeAxes: ReadonlyArray<string>;
};

export const defaultThreadFilters: ThreadFilters = {
  projects: [],
  participants: null,
  authors: [],
  statuses: [],
  origins: [],
  automations: [],
  models: [],
  prStates: [],
  created: null,
  updated: null,
  archived: "exclude",
  negativeAxes: [],
};

export type ThreadView = {
  readonly key: "my" | "all" | "archived";
  readonly label: string;
  readonly filters: ThreadFilters;
};

export const threadViews: ReadonlyArray<ThreadView> = [
  { key: "my", label: "My threads", filters: defaultThreadFilters },
  {
    key: "all",
    label: "All threads",
    filters: { ...defaultThreadFilters, participants: [] },
  },
  {
    key: "archived",
    label: "Archived",
    filters: { ...defaultThreadFilters, archived: "only" },
  },
];

export type ThreadGrouping = "project" | "author" | "none";
export type ThreadOrdering = "updated" | "created" | "prState";

export const groupingLabels: Record<ThreadGrouping, string> = {
  project: "Project",
  author: "Author",
  none: "No grouping",
};

export const orderingLabels: Record<ThreadOrdering, string> = {
  updated: "Updated at",
  created: "Created at",
  prState: "PR state",
};

export type SavedThreadView = {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly filters: ThreadFilters;
};

export type ThreadsPageState = {
  readonly filters: ThreadFilters;
  readonly savedViews: ReadonlyArray<SavedThreadView>;
  readonly grouping: ThreadGrouping;
  readonly ordering: ThreadOrdering;
  readonly showFiledThreads: boolean;
};

export const defaultThreadsPageState: ThreadsPageState = {
  filters: defaultThreadFilters,
  savedViews: [],
  grouping: "none",
  ordering: "updated",
  showFiledThreads: false,
};

export const threadsPageStorageKey = "capy-web:threads-page-v4";

const sorted = (values: ReadonlyArray<string>) => [...values].sort();

const automationsVisible = (filters: ThreadFilters) =>
  filters.origins.length === 0 && filters.automations.length === 0
    ? filters.negativeAxes.includes("automationVisibility")
    : filters.negativeAxes.includes("origins")
      ? !filters.origins.includes("automation")
      : filters.origins.includes("automation") ||
        filters.automations.length > 0;

const normalise = (filters: ThreadFilters) => {
  const live = new Set([
    ...(filters.projects.length > 0 ? ["projects"] : []),
    ...(filters.participants === null || filters.participants.length > 0
      ? ["participants"]
      : []),
    ...(filters.authors.length > 0 ? ["authors"] : []),
    ...(filters.origins.length > 0 || filters.automations.length > 0
      ? ["origins"]
      : ["automationVisibility"]),
    ...(filters.models.length > 0 ? ["models"] : []),
    ...(filters.prStates.length > 0 ? ["prStates"] : []),
    ...(filters.created === null ? [] : ["created"]),
    ...(filters.updated === null ? [] : ["updated"]),
    ...(filters.archived === "only" ? ["archived"] : []),
  ]);
  return {
    ...filters,
    projects: sorted(filters.projects),
    participants:
      filters.participants === null ? null : sorted(filters.participants),
    authors: sorted(filters.authors),
    statuses: sorted(filters.statuses),
    origins: sorted(filters.origins),
    automations: sorted(filters.automations),
    models: sorted(filters.models),
    prStates: sorted(filters.prStates),
    negativeAxes: [...new Set(filters.negativeAxes)]
      .filter((axis) => live.has(axis))
      .sort(),
  };
};

export const sameFilters = (a: ThreadFilters, b: ThreadFilters) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

/** The built-in view key or saved view id whose filters match, if any. */
export const activeViewKey = (state: ThreadsPageState) =>
  threadViews.find((view) => sameFilters(view.filters, state.filters))?.key ??
  state.savedViews.find((view) => sameFilters(view.filters, state.filters))?.id;

export const threadCode = (
  thread: Pick<ThreadListItem, "threadNumber" | "projectId">,
  projects: ReadonlyMap<string, ProjectSummary>,
) => {
  if (thread.threadNumber === null) return null;
  const code =
    thread.projectId === null
      ? undefined
      : projects.get(thread.projectId)?.code;
  return code === undefined
    ? "#" + thread.threadNumber
    : code + "-" + thread.threadNumber;
};

const second = 1000;
const minute = 60 * second;
const hourMs = 60 * minute;
const dayMs = 24 * hourMs;
const weekMs = 7 * dayMs;
const yearMs = 365 * dayMs;

export const formatAge = (
  date: Date,
  options: { now: number; minified?: boolean },
) => {
  const delta = options.now - date.getTime();
  const minified = options.minified === true;
  const span = Math.abs(delta);
  if (span < 5 * second) return minified ? "now" : "just now";
  const unit =
    span < minute
      ? Math.floor(span / second) + "s"
      : span < hourMs
        ? Math.floor(span / minute) + "m"
        : span < dayMs
          ? Math.floor(span / hourMs) + "h"
          : span < weekMs
            ? Math.floor(span / dayMs) + "d"
            : span < yearMs
              ? Math.floor(span / weekMs) + "w"
              : Math.floor(span / yearMs) + "y";
  return minified ? unit : delta < 0 ? "in " + unit : unit + " ago";
};

const negated = (filters: ThreadFilters, axis: string) =>
  filters.negativeAxes.includes(axis);

const keep = (match: boolean, filters: ThreadFilters, axis: string) =>
  negated(filters, axis) ? !match : match;

/** Client-side filtering of the loaded list, mirroring the query Capy sends. */
export const filterThreads = (
  threads: ReadonlyArray<ThreadListItem>,
  filters: ThreadFilters,
  viewerId: string | undefined,
  now: number,
) => {
  const participants =
    filters.participants === null
      ? automationsVisible(filters) || viewerId === undefined
        ? undefined
        : [viewerId]
      : filters.participants.length === 0
        ? undefined
        : filters.participants;
  const archivedOnly =
    filters.archived === "only" && !negated(filters, "archived");
  return threads.filter((thread) => {
    if (archivedOnly !== thread.archived) return false;
    if (
      filters.projects.length > 0 &&
      !keep(
        thread.projectId !== null &&
          filters.projects.includes(thread.projectId),
        filters,
        "projects",
      )
    )
      return false;
    if (
      participants !== undefined &&
      !keep(
        participants.includes(thread.userId) ||
          (participants.includes(viewerId ?? "") && thread.participated),
        filters,
        "participants",
      )
    )
      return false;
    if (
      filters.authors.length > 0 &&
      !keep(filters.authors.includes(thread.userId), filters, "authors")
    )
      return false;
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(thread.status)
    )
      return false;
    const isAutomation = thread.automationName !== null;
    if (filters.origins.length === 0 && filters.automations.length === 0) {
      if (!negated(filters, "automationVisibility") && isAutomation)
        return false;
    } else if (
      !keep(
        isAutomation
          ? filters.automations.length === 0
            ? filters.origins.includes("automation")
            : thread.automationId !== null &&
              filters.automations.includes(thread.automationId)
          : filters.origins.includes(thread.origin),
        filters,
        "origins",
      )
    )
      return false;
    if (
      filters.models.length > 0 &&
      !keep(
        thread.lastModelId !== null &&
          filters.models.includes(thread.lastModelId),
        filters,
        "models",
      )
    )
      return false;
    if (
      filters.prStates.length > 0 &&
      !keep(
        filters.prStates.includes(thread.pulls[0]?.state ?? "none"),
        filters,
        "prStates",
      )
    )
      return false;
    if (
      filters.created !== null &&
      !keep(
        matchesDateRange(thread.createdAt, filters.created, now),
        filters,
        "created",
      )
    )
      return false;
    if (
      filters.updated !== null &&
      !keep(
        matchesDateRange(thread.sortActivityAt, filters.updated, now),
        filters,
        "updated",
      )
    )
      return false;
    return true;
  });
};

const prOrder = [
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
  "none",
];

export const threadComparator = (ordering: ThreadOrdering) => {
  const byActivity = (a: ThreadListItem, b: ThreadListItem) =>
    b.sortActivityAt.getTime() - a.sortActivityAt.getTime() ||
    b.id.localeCompare(a.id);
  if (ordering === "created")
    return (a: ThreadListItem, b: ThreadListItem) =>
      b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id);
  if (ordering === "prState") {
    const rank = (thread: ThreadListItem) => {
      const at = prOrder.indexOf(thread.pulls[0]?.state ?? "none");
      return at === -1 ? prOrder.length : at;
    };
    return (a: ThreadListItem, b: ThreadListItem) =>
      rank(a) - rank(b) || byActivity(a, b);
  }
  return byActivity;
};

export type ThreadShelf = "asks" | "working" | "settled" | "returned";

const busy = (thread: ThreadListItem) =>
  thread.status === "working" || thread.status === "waiting";

/** Capy's sidebar shelves: needs you, working, settled (merged, idle a week, or settled by hand), the rest. */
export const threadShelf = (
  thread: ThreadListItem,
  now: number,
): ThreadShelf => {
  if (thread.needsYou) return "asks";
  if (busy(thread)) return "working";
  const settledByHand =
    thread.settledAt !== null &&
    thread.settledAt.getTime() > thread.sortActivityAt.getTime();
  const merged =
    thread.pulls.length > 0 &&
    thread.pulls.every(
      (pull) => pull.state === "merged" || pull.state === "closed",
    );
  const stale =
    now - (thread.lastActivityAt ?? thread.sortActivityAt).getTime() >
    7 * dayMs;
  return settledByHand || (!thread.hasUnreads && (merged || stale))
    ? "settled"
    : "returned";
};

export type ThreadSection = {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<ThreadListItem>;
  readonly showCount: boolean;
};

/** A section whose id starts with "closed:" starts collapsed. */
export const sectionStartsOpen = (id: string) => !id.startsWith("closed:");

export const buildSections = (options: {
  threads: ReadonlyArray<ThreadListItem>;
  filters: ThreadFilters;
  grouping: ThreadGrouping;
  ordering: ThreadOrdering;
  searching: boolean;
  now: number;
  projectName: (id: string | null) => string;
  authorName: (id: string) => string;
}): ThreadSection[] => {
  const { threads, filters, grouping, ordering, now } = options;
  const compare = threadComparator(ordering);
  if (options.searching) {
    return threads.length === 0
      ? []
      : [
          {
            id: "results",
            label: "Results",
            members: threads,
            showCount: true,
          },
        ];
  }
  if (filters.archived === "only") {
    const members = threads.toSorted(compare);
    return members.length === 0
      ? []
      : [{ id: "archived", label: "Archived", members, showCount: true }];
  }
  const captains = threads
    .filter((thread) => thread.captain !== null)
    .toSorted(compare);
  const captainSections: ThreadSection[] =
    captains.length === 0
      ? []
      : [
          {
            id: "captains",
            label: "Captains",
            members: captains,
            showCount: true,
          },
        ];
  const rest = threads
    .filter((thread) => thread.captain === null)
    .toSorted(compare);
  if (grouping === "project" || grouping === "author") {
    const groups = new Map<string, ThreadListItem[]>();
    for (const thread of rest) {
      const key =
        grouping === "project" ? (thread.projectId ?? "") : thread.userId;
      groups.set(key, [...(groups.get(key) ?? []), thread]);
    }
    return [
      ...captainSections,
      ...[...groups].map(([key, members]) => ({
        id: grouping + ":" + key,
        label:
          grouping === "project"
            ? options.projectName(key === "" ? null : key)
            : options.authorName(key),
        members,
        showCount: false,
      })),
    ];
  }
  const shelves: Record<ThreadShelf, ThreadListItem[]> = {
    asks: [],
    returned: [],
    working: [],
    settled: [],
  };
  for (const thread of rest) shelves[threadShelf(thread, now)].push(thread);
  return [
    ...captainSections,
    ...[
      {
        id: "shelf:asks",
        label: "Needs you",
        members: shelves.asks,
        showCount: true,
      },
      {
        id: "all",
        label: "Active",
        members: shelves.returned,
        showCount: false,
      },
      {
        id: "closed:shelf:working",
        label: "Working",
        members: shelves.working,
        showCount: true,
      },
      {
        id: "closed:shelf:settled",
        label: "Settled",
        members: shelves.settled,
        showCount: true,
      },
    ].filter((section) => section.members.length > 0),
  ];
};

/** Which empty-state copy the list shows (toasts-and-states.md, threads). */
export const emptyText = (options: {
  failed: boolean;
  searching: boolean;
  filters: ThreadFilters;
}) => {
  const runs = options.filters.automations.length > 0;
  if (options.failed) return runs ? "Runs unavailable" : "Threads unavailable";
  if (options.searching)
    return runs ? "No matching runs" : "No matching threads";
  if (runs)
    return sameFilters(options.filters, {
      ...defaultThreadFilters,
      automations: options.filters.automations,
    })
      ? "No runs yet"
      : "No runs match these filters";
  return sameFilters(options.filters, defaultThreadFilters)
    ? "No threads yet"
    : "No threads match these filters";
};

const listLabel = (values: ReadonlyArray<string>, noun: string) =>
  values.length <= 2 ? values.join(", ") : values.length + " " + noun;

const toggleAxis = (
  filters: ThreadFilters,
  axis: string,
  sign: "positive" | "negative",
): ThreadFilters => ({
  ...filters,
  negativeAxes:
    sign === "negative"
      ? [...new Set([...filters.negativeAxes, axis])]
      : filters.negativeAxes.filter((existing) => existing !== axis),
});

const clearAxis = (filters: ThreadFilters, axis: string): ThreadFilters => ({
  ...filters,
  negativeAxes: filters.negativeAxes.filter((existing) => existing !== axis),
});

export type ChipIcons = {
  readonly participants?: React.ReactNode;
  readonly automations?: React.ReactNode;
  readonly project?: React.ReactNode;
  readonly created?: React.ReactNode;
  readonly updated?: React.ReactNode;
  readonly archived?: React.ReactNode;
};

/** The chips under the toolbar: one per active filter, plus the default "Participants is Me" and "Automations are Hidden". */
export const threadFilterChips = (
  filters: ThreadFilters,
  onChange: (filters: ThreadFilters) => void,
  names: {
    member: (id: string) => string;
    project: (id: string) => string;
    automation: (id: string) => string;
    dateRange: (range: DateRange) => string;
  },
  icons: ChipIcons = {},
): FilterChipModel[] => {
  const binary = (
    axis: string,
    cardinality: "one" | "many",
    agreement: "is" | "are" = "is",
  ) => ({
    kind: "binary" as const,
    sign: negated(filters, axis)
      ? ("negative" as const)
      : ("positive" as const),
    agreement,
    cardinality,
    onChange: (sign: "positive" | "negative") =>
      onChange(toggleAxis(filters, axis, sign)),
  });
  const chips: FilterChipModel[] = [];
  if (filters.automations.length > 0 && filters.origins.length === 0)
    chips.push({
      key: "automations",
      icon: icons.automations,
      property: "Automation",
      operator: binary(
        "origins",
        filters.automations.length === 1 ? "one" : "many",
      ),
      value: listLabel(
        filters.automations.map(names.automation),
        "automations",
      ),
      onRemove: () =>
        onChange(clearAxis({ ...filters, automations: [] }, "origins")),
    });
  if (filters.participants === null) {
    if (!automationsVisible(filters))
      chips.push({
        key: "participants-me",
        icon: icons.participants,
        property: "Participants",
        operator: binary("participants", "one"),
        value: "Me",
        onRemove: () =>
          onChange(clearAxis({ ...filters, participants: [] }, "participants")),
      });
  } else if (filters.participants.length > 0)
    chips.push({
      key: "participants",
      icon: icons.participants,
      property: "Participants",
      operator: binary(
        "participants",
        filters.participants.length === 1 ? "one" : "many",
      ),
      value: listLabel(filters.participants.map(names.member), "members"),
      onRemove: () =>
        onChange(clearAxis({ ...filters, participants: [] }, "participants")),
    });
  if (filters.projects.length > 0)
    chips.push({
      key: "projects",
      icon: icons.project,
      property: "Project",
      operator: binary(
        "projects",
        filters.projects.length === 1 ? "one" : "many",
      ),
      value: listLabel(filters.projects.map(names.project), "projects"),
      onRemove: () =>
        onChange(clearAxis({ ...filters, projects: [] }, "projects")),
    });
  if (filters.automations.length === 0 && filters.origins.length === 0)
    chips.push({
      key: "origins-default",
      icon: icons.automations,
      property: "Automations",
      operator: {
        ...binary("automationVisibility", "one", "are"),
        onChange: (sign) =>
          onChange(
            toggleAxis(
              { ...filters, origins: [] },
              "automationVisibility",
              sign,
            ),
          ),
      },
      value: "Hidden",
      onRemove: () =>
        onChange(toggleAxis(filters, "automationVisibility", "negative")),
    });
  if (filters.created !== null) {
    const range = filters.created;
    chips.push({
      key: "created",
      icon: icons.created,
      property: "Created",
      operator: binary("created", "one"),
      value: names.dateRange(range),
      onRemove: () =>
        onChange(clearAxis({ ...filters, created: null }, "created")),
    });
  }
  if (filters.updated !== null) {
    const range = filters.updated;
    chips.push({
      key: "updated",
      icon: icons.updated,
      property: "Updated",
      operator: binary("updated", "one"),
      value: names.dateRange(range),
      onRemove: () =>
        onChange(clearAxis({ ...filters, updated: null }, "updated")),
    });
  }
  if (filters.archived === "only")
    chips.push({
      key: "archived",
      icon: icons.archived,
      property: "Archived",
      operator: {
        kind: "fixed",
        label: filterOperatorLabel({
          agreement: "is",
          cardinality: "one",
          sign: "positive",
        }),
      },
      value: "Only",
      onRemove: () => onChange({ ...filters, archived: "exclude" }),
    });
  return chips;
};
