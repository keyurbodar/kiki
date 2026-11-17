import { matchText } from "@/components/filter-search";
import {
  customDateBounds,
  type DateRange,
  dateRangePresets,
  isCustomDateRange,
  isIsoDay,
  matchesDateRange,
  type SavedView,
} from "@/components/view-toolbar";
import type { AutomationRow } from "../automations-list/automation";
import {
  isTriggerType,
  type TriggerType,
  triggerTypeLabels,
} from "../automations-list/triggers";

export type FilterAxis = "sources" | "creators" | "created" | "projects";

export type AutomationStatus = "active" | "disabled";

export type AutomationFilters = {
  readonly sources: ReadonlyArray<TriggerType>;
  /** null means "Me"; an empty list means anyone. */
  readonly creators: ReadonlyArray<string> | null;
  readonly created: DateRange | null;
  readonly projects: ReadonlyArray<string>;
  readonly status: AutomationStatus | null;
  readonly negativeAxes: ReadonlyArray<FilterAxis>;
};

export type AutomationOrdering = "run" | "created" | "name";

export type AutomationsPageState = {
  readonly filters: AutomationFilters;
  readonly savedViews: ReadonlyArray<SavedView<AutomationFilters>>;
  readonly ordering: AutomationOrdering;
};

export const orderingLabels: Record<AutomationOrdering, string> = {
  run: "Recently run",
  created: "Recently created",
  name: "Name",
};

export const statusLabels: Record<AutomationStatus, string> = {
  active: "Active",
  disabled: "Disabled",
};

export const emptyFilters: AutomationFilters = {
  sources: [],
  creators: [],
  created: null,
  projects: [],
  status: null,
  negativeAxes: [],
};

export const viewPresets = [
  {
    key: "mine",
    label: "My automations",
    filters: { ...emptyFilters, creators: null },
  },
  { key: "all", label: "All automations", filters: emptyFilters },
  {
    key: "scheduled",
    label: "Scheduled",
    filters: { ...emptyFilters, sources: ["schedule"] },
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  filters: AutomationFilters;
}>;

export const defaultPageState: AutomationsPageState = {
  filters: viewPresets[0].filters,
  savedViews: [],
  ordering: "run",
};

const sorted = <A extends string>(values: ReadonlyArray<A>) =>
  [...values].sort();

/** Canonical form: sorted lists, negations only on axes that are set. */
export const normalizeFilters = (
  filters: AutomationFilters,
): AutomationFilters => {
  const set = new Set<FilterAxis>([
    ...(filters.sources.length > 0 ? (["sources"] as const) : []),
    ...(filters.creators === null || filters.creators.length > 0
      ? (["creators"] as const)
      : []),
    ...(filters.created === null ? [] : (["created"] as const)),
    ...(filters.projects.length > 0 ? (["projects"] as const) : []),
  ]);
  return {
    ...filters,
    sources: sorted(filters.sources),
    projects: sorted(filters.projects),
    creators: filters.creators === null ? null : sorted(filters.creators),
    negativeAxes: sorted(
      [...new Set(filters.negativeAxes)].filter((axis) => set.has(axis)),
    ),
  };
};

export const sameFilters = (a: AutomationFilters, b: AutomationFilters) =>
  JSON.stringify(normalizeFilters(a)) === JSON.stringify(normalizeFilters(b));

/** The preset or saved view the filters match, if any. */
export const activeViewKey = (state: AutomationsPageState) =>
  viewPresets.find((preset) => sameFilters(preset.filters, state.filters))
    ?.key ??
  state.savedViews.find((view) => sameFilters(view.filters, state.filters))?.id;

/** Client-side match, mirroring what listPage can't filter on the server. */
export const matchesFilters = (
  row: AutomationRow,
  filters: AutomationFilters,
  now: number,
  viewerId: string | undefined,
) => {
  const signed = (axis: FilterAxis, value: boolean) =>
    filters.negativeAxes.includes(axis) ? !value : value;
  if (
    filters.sources.length > 0 &&
    !signed(
      "sources",
      row.triggers.some((trigger) => filters.sources.includes(trigger.type)),
    )
  )
    return false;
  if (filters.creators === null) {
    if (
      viewerId === undefined ||
      !signed("creators", row.creatorUserId === viewerId)
    )
      return false;
  } else if (
    filters.creators.length > 0 &&
    !signed("creators", filters.creators.includes(row.creatorUserId))
  )
    return false;
  if (
    filters.created !== null &&
    !signed("created", matchesDateRange(row.createdAt, filters.created, now))
  )
    return false;
  if (
    filters.projects.length > 0 &&
    !signed("projects", filters.projects.includes(row.projectId))
  )
    return false;
  return (
    filters.status === null || row.enabled === (filters.status === "active")
  );
};

const dayMs = 24 * 60 * 60 * 1000;

const createdBounds = (range: DateRange, now: number) => {
  const floorDay = (time: number) => new Date(time - (time % dayMs));
  if (isCustomDateRange(range)) {
    const bounds = customDateBounds(range.from, range.to);
    return bounds === undefined
      ? {}
      : { from: bounds.after, to: new Date(bounds.before.getTime() + 1) };
  }
  if (range === "older") return { to: floorDay(now - 29 * dayMs) };
  const days = { today: 1, week: 7, month: 30 }[range];
  return { from: floorDay(now - days * dayMs) };
};

/** Server-side part of the filters, sent as listPage query params. */
export const listQuery = (filters: AutomationFilters, now: number) => {
  const bounds: { from?: Date; to?: Date } =
    filters.created === null || filters.negativeAxes.includes("created")
      ? {}
      : createdBounds(filters.created, now);
  const byProject =
    filters.projects.length > 0 && filters.projects.length <= 100;
  return {
    projectIds: byProject ? filters.projects : undefined,
    projectIdsNot:
      byProject && filters.negativeAxes.includes("projects")
        ? ("1" as const)
        : undefined,
    enabled:
      filters.status === null
        ? undefined
        : filters.status === "active"
          ? ("1" as const)
          : ("0" as const),
    createdFrom: bounds.from?.toISOString(),
    createdTo: bounds.to?.toISOString(),
  };
};

export const compareAutomations =
  (ordering: AutomationOrdering) => (a: AutomationRow, b: AutomationRow) => {
    if (ordering === "created")
      return (
        b.createdAt.getTime() - a.createdAt.getTime() ||
        b.id.localeCompare(a.id)
      );
    if (ordering === "name")
      return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    return (
      (b.lastTriggeredAt?.getTime() ?? 0) -
        (a.lastTriggeredAt?.getTime() ?? 0) ||
      b.createdAt.getTime() - a.createdAt.getTime() ||
      b.id.localeCompare(a.id)
    );
  };

/** Search over name, creator, description and trigger sources. */
export const matchesSearch = (row: AutomationRow, query: string) =>
  [
    row.name,
    row.creator,
    row.description ?? "",
    ...row.triggers.map((trigger) => triggerTypeLabels[trigger.type]),
  ].some((field) => matchText(field, query) !== undefined);

export type AutomationSection = {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<AutomationRow>;
};

/** Active and Disabled sections, or one Results section while searching. */
export const automationSections = (
  rows: ReadonlyArray<AutomationRow>,
  state: AutomationsPageState,
  search: string,
  now: number,
  viewerId: string | undefined,
): AutomationSection[] => {
  const visible = rows
    .filter((row) => matchesFilters(row, state.filters, now, viewerId))
    .toSorted(compareAutomations(state.ordering));
  const query = search.trim();
  if (query.length > 0) {
    const hits = visible.filter((row) => matchesSearch(row, query));
    return hits.length === 0
      ? []
      : [{ id: "results", label: "Results", members: hits }];
  }
  return [
    {
      id: "active",
      label: "Active",
      members: visible.filter((row) => row.enabled),
    },
    {
      id: "disabled",
      label: "Disabled",
      members: visible.filter((row) => !row.enabled),
    },
  ].filter((section) => section.members.length > 0);
};

export const emptyText = (
  search: string,
  totalRows: number,
  serverQuery: string,
) =>
  search.trim().length > 0
    ? `No automations match "${search.trim()}"`
    : totalRows === 0 && serverQuery === "{}"
      ? "No automations yet"
      : "No automations match these filters";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;

const decodeDateRange = (value: unknown): DateRange | null | undefined => {
  if (value === null) return null;
  if (
    typeof value === "string" &&
    (dateRangePresets as ReadonlyArray<string>).includes(value)
  )
    return value as DateRange;
  if (
    isRecord(value) &&
    value.kind === "custom" &&
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    isIsoDay(value.from) &&
    isIsoDay(value.to)
  )
    return { kind: "custom", from: value.from, to: value.to };
  return undefined;
};

const axes: ReadonlyArray<FilterAxis> = [
  "sources",
  "creators",
  "created",
  "projects",
];

const decodeFilters = (value: unknown): AutomationFilters | undefined => {
  if (!isRecord(value)) return undefined;
  const sources = strings(value.sources);
  const created = decodeDateRange(value.created ?? null);
  const creators = value.creators === null ? null : strings(value.creators);
  if (sources === undefined || created === undefined || creators === undefined)
    return undefined;
  const status =
    value.status === "active" || value.status === "disabled"
      ? value.status
      : null;
  return {
    sources: sources.filter(isTriggerType),
    creators,
    created,
    projects: strings(value.projects) ?? [],
    status,
    negativeAxes: (strings(value.negativeAxes) ?? []).filter(
      (axis): axis is FilterAxis =>
        (axes as ReadonlyArray<string>).includes(axis),
    ),
  };
};

/** Reads persisted page state, falling back to the default on any mismatch. */
export const decodePageState = (raw: string | null): AutomationsPageState => {
  if (raw === null) return defaultPageState;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return defaultPageState;
    const filters = decodeFilters(value.filters);
    const ordering =
      value.ordering === "run" ||
      value.ordering === "created" ||
      value.ordering === "name"
        ? value.ordering
        : undefined;
    if (filters === undefined || ordering === undefined)
      return defaultPageState;
    const savedViews = (
      Array.isArray(value.savedViews) ? value.savedViews : []
    ).flatMap((view): SavedView<AutomationFilters>[] => {
      if (!isRecord(view)) return [];
      const viewFilters = decodeFilters(view.filters);
      if (
        typeof view.id !== "string" ||
        typeof view.name !== "string" ||
        viewFilters === undefined
      )
        return [];
      return [
        {
          id: view.id,
          name: view.name,
          icon: typeof view.icon === "string" ? view.icon : null,
          filters: viewFilters,
        },
      ];
    });
    return { filters, savedViews, ordering };
  } catch {
    return defaultPageState;
  }
};

export const pageStateStorageKey = "capy-web:automations-page-v3";
