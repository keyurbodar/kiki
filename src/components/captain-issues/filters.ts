import {
  emptyActorFilter,
  emptyIssueFilters,
  type IssueFilters,
} from "../issues-filters/filters";

export const captainIssueViews = ["all", "assigned", "mentioned"] as const;

export type CaptainIssueView = (typeof captainIssueViews)[number];

export const captainIssueViewLabels: Record<CaptainIssueView, string> = {
  all: "All",
  assigned: "Assigned to me",
  mentioned: "Mentioned",
};

export const captainIssueViewEmptyText: Record<CaptainIssueView, string> = {
  all: "No issues for this crew yet",
  assigned: "Nothing in this crew is assigned to you",
  mentioned: "No issues in this crew mention you",
};

/**
 * The part of Capy's issue filter schema the crew issues pane reads. The full
 * schema (assignee, creator, labels, due dates, ...) belongs to the issues
 * filters package; fields here keep its names and defaults.
 */
export type CaptainIssueFilters = {
  assigneeMe: boolean;
  mentioned: boolean;
  stateIds: ReadonlyArray<string>;
  stateNot: boolean;
  hideClosedSubIssues: boolean;
};

export const defaultCaptainIssueFilters: CaptainIssueFilters = {
  assigneeMe: false,
  mentioned: false,
  stateIds: [],
  stateNot: false,
  hideClosedSubIssues: false,
};

export const filtersForView = (
  view: CaptainIssueView,
): CaptainIssueFilters => ({
  ...defaultCaptainIssueFilters,
  assigneeMe: view === "assigned",
  mentioned: view === "mentioned",
});

/**
 * The pane's filters as the shared issue filter model, for the menus the
 * issues package ships. Only the fields the pane reads cross over.
 */
export const toIssueFilters = (filters: CaptainIssueFilters): IssueFilters => ({
  ...emptyIssueFilters,
  assignee: { ...emptyActorFilter, me: filters.assigneeMe },
  mentioned: filters.mentioned,
  stateIds: filters.stateIds,
  stateNot: filters.stateNot,
  hideClosedSubIssues: filters.hideClosedSubIssues,
});

/** The part of the shared issue filters the crew issues pane reads. */
export const fromIssueFilters = (
  filters: IssueFilters,
): CaptainIssueFilters => ({
  assigneeMe: filters.assignee.me,
  mentioned: filters.mentioned,
  stateIds: filters.stateIds,
  stateNot: filters.stateNot && filters.stateIds.length > 0,
  hideClosedSubIssues: filters.hideClosedSubIssues,
});

const encode = (filters: CaptainIssueFilters) =>
  JSON.stringify({
    assigneeMe: filters.assigneeMe,
    mentioned: filters.mentioned,
    stateIds: [...filters.stateIds].sort(),
    stateNot: filters.stateIds.length > 0 && filters.stateNot,
    hideClosedSubIssues: filters.hideClosedSubIssues,
  });

/** The preset view these filters equal, or undefined for custom filters. */
export const viewForFilters = (
  views: ReadonlyArray<CaptainIssueView>,
  filters: CaptainIssueFilters,
) => {
  const key = encode(filters);
  return views.find((view) => encode(filtersForView(view)) === key);
};

export const captainIssuesEmptyText = (
  search: string,
  view: CaptainIssueView | undefined,
) => {
  if (search !== "") return "No matching issues";
  return view === undefined
    ? "No issues match these filters"
    : captainIssueViewEmptyText[view];
};

/** A stable key for the list query; empty for the default, unsearched list. */
export const captainIssuesFiltersKey = (
  filters: CaptainIssueFilters,
  search: string,
) => {
  const trimmed = search.trim().slice(0, 100);
  const key = encode(filters);
  if (trimmed === "" && key === encode(defaultCaptainIssueFilters)) return "";
  return trimmed === "" ? key : `${key}|${trimmed}`;
};
