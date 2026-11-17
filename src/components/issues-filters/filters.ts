export const issueDueBuckets = [
  "today",
  "tomorrow",
  "this_week",
  "next_week",
  "this_month",
  "overdue",
  "none",
] as const;
export type IssueDueBucket = (typeof issueDueBuckets)[number];

export const issueRelationFilters = [
  "parent",
  "sub_issue",
  "blocked",
  "blocking",
  "related",
  "has_relations",
] as const;
export type IssueRelationFilter = (typeof issueRelationFilters)[number];

export const captainScopes = ["owned", "member", "subscribed"] as const;
export type CaptainScope = (typeof captainScopes)[number];

export const captainScopeLabels: Record<CaptainScope, string> = {
  owned: "My Captains",
  member: "Captains I'm in",
  subscribed: "Subscribed Captains",
};

export type IssueMatch = "all" | "any";
export type IssueLabelMatch = "any" | "all" | "none";
export type IssuePullFilter = "linked" | "none";

/** One people filter (assignee or creator): explicit ids plus the shortcuts. */
export type ActorFilter = {
  readonly userIds: ReadonlyArray<string>;
  readonly jamIds: ReadonlyArray<string>;
  readonly none: boolean;
  readonly me: boolean;
  readonly captains: CaptainScope | null;
};

export type IssueFilters = {
  readonly match: IssueMatch;
  readonly assignee: ActorFilter;
  readonly assigneeNot: boolean;
  readonly creator: ActorFilter;
  readonly creatorNot: boolean;
  readonly mentioned: boolean;
  readonly mentionedIds: ReadonlyArray<string>;
  readonly mentionedNot: boolean;
  readonly subscribed: boolean;
  readonly subscribedIds: ReadonlyArray<string>;
  readonly subscribedNot: boolean;
  readonly priorities: ReadonlyArray<string>;
  readonly prioritiesNot: boolean;
  readonly projectIds: ReadonlyArray<string>;
  readonly projectIdsNot: boolean;
  readonly labelIds: ReadonlyArray<string>;
  readonly labelMatch: IssueLabelMatch;
  readonly due: ReadonlyArray<IssueDueBucket>;
  readonly dueFrom: string | null;
  readonly dueTo: string | null;
  readonly dueNot: boolean;
  readonly stateIds: ReadonlyArray<string>;
  readonly stateNot: boolean;
  readonly pull: IssuePullFilter | null;
  readonly relations: ReadonlyArray<IssueRelationFilter>;
  readonly excludedRelations: ReadonlyArray<IssueRelationFilter>;
  readonly hideClosedSubIssues: boolean;
};

export const emptyActorFilter: ActorFilter = {
  userIds: [],
  jamIds: [],
  none: false,
  me: false,
  captains: null,
};

export const emptyIssueFilters: IssueFilters = {
  match: "all",
  assignee: emptyActorFilter,
  assigneeNot: false,
  creator: emptyActorFilter,
  creatorNot: false,
  mentioned: false,
  mentionedIds: [],
  mentionedNot: false,
  subscribed: false,
  subscribedIds: [],
  subscribedNot: false,
  priorities: [],
  prioritiesNot: false,
  projectIds: [],
  projectIdsNot: false,
  labelIds: [],
  labelMatch: "any",
  due: [],
  dueFrom: null,
  dueTo: null,
  dueNot: false,
  stateIds: [],
  stateNot: false,
  pull: null,
  relations: [],
  excludedRelations: [],
  hideClosedSubIssues: false,
};

export const issueViews = [
  "for_you",
  "assigned",
  "created",
  "mentioned",
  "all",
] as const;
export type IssueView = (typeof issueViews)[number];

export const issueViewLabels: Record<IssueView, string> = {
  for_you: "For you",
  assigned: "Assigned to me",
  created: "Created by me",
  mentioned: "Mentioned",
  all: "All",
};

export const issueViewEmptyText: Record<IssueView, string> = {
  for_you: "Nothing for you yet",
  assigned: "Nothing assigned to you",
  created: "No issues yet",
  mentioned: "No issues mention you",
  all: "No issues yet",
};

export const issueEmptyText = (view: IssueView | undefined, search: string) =>
  search !== ""
    ? "No matching issues"
    : view === undefined
      ? "No issues match these filters"
      : issueViewEmptyText[view];

const meAndCrew: ActorFilter = {
  ...emptyActorFilter,
  me: true,
  captains: "member",
};

export const filtersForView = (view: IssueView): IssueFilters => {
  switch (view) {
    case "for_you":
      return {
        ...emptyIssueFilters,
        match: "any",
        assignee: meAndCrew,
        creator: meAndCrew,
      };
    case "assigned":
      return {
        ...emptyIssueFilters,
        assignee: { ...emptyActorFilter, me: true },
      };
    case "created":
      return {
        ...emptyIssueFilters,
        creator: { ...emptyActorFilter, me: true },
      };
    case "mentioned":
      return { ...emptyIssueFilters, mentioned: true };
    case "all":
      return emptyIssueFilters;
  }
};

const canonical = (filters: IssueFilters) =>
  JSON.stringify(filters, (_key, value: unknown) =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  );

/** The preset view these filters equal, if any. */
export const viewOfFilters = (filters: IssueFilters): IssueView | undefined => {
  const key = canonical(filters);
  return issueViews.find((view) => canonical(filtersForView(view)) === key);
};

export const actorCount = (filter: ActorFilter) =>
  filter.userIds.length +
  filter.jamIds.length +
  Number(filter.none) +
  Number(filter.me) +
  (filter.captains === null ? 0 : 1);

export const mentionedCount = (filters: IssueFilters) =>
  filters.mentionedIds.length + Number(filters.mentioned);

export const subscribedCount = (filters: IssueFilters) =>
  filters.subscribedIds.length + Number(filters.subscribed);

export const dueCount = (filters: IssueFilters) =>
  filters.due.length +
  (filters.dueFrom === null && filters.dueTo === null ? 0 : 1);

/** Filters the Match chip combines: people, mentions, subscribers, pulls. */
export const matchableCount = (filters: IssueFilters) =>
  [
    actorCount(filters.assignee) > 0,
    actorCount(filters.creator) > 0,
    mentionedCount(filters) > 0,
    subscribedCount(filters) > 0,
    filters.pull !== null,
  ].filter(Boolean).length;

export const hasIssueFilters = (filters: IssueFilters) =>
  matchableCount(filters) +
    filters.stateIds.length +
    filters.priorities.length +
    dueCount(filters) +
    filters.projectIds.length +
    filters.labelIds.length +
    filters.relations.length +
    filters.excludedRelations.length >
    0 || filters.hideClosedSubIssues;

/** At most this many values per filter, as in Capy. */
export const issueFilterLimit = 50;

/** Adds or removes a value; past the limit the list is returned unchanged. */
export const toggleValue = <A>(values: ReadonlyArray<A>, value: A) =>
  values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : values.length >= issueFilterLimit
      ? values
      : [...values, value];

export type ActorToggle =
  | { readonly kind: "me" }
  | { readonly kind: "none" }
  | { readonly kind: "captains"; readonly scope: CaptainScope }
  | { readonly kind: "user"; readonly id: string }
  | { readonly kind: "jam"; readonly id: string };

export const toggleActor = (
  filter: ActorFilter,
  toggle: ActorToggle,
): ActorFilter => {
  switch (toggle.kind) {
    case "me":
      return { ...filter, me: !filter.me };
    case "none":
      return { ...filter, none: !filter.none };
    case "captains":
      return {
        ...filter,
        captains: filter.captains === toggle.scope ? null : toggle.scope,
      };
    case "user":
      return { ...filter, userIds: toggleValue(filter.userIds, toggle.id) };
    case "jam":
      return { ...filter, jamIds: toggleValue(filter.jamIds, toggle.id) };
  }
};

/** Whether a state passes the status filter. */
export const stateVisible = (filters: IssueFilters, stateId: string) =>
  filters.stateIds.length === 0 ||
  filters.stateIds.includes(stateId) !== filters.stateNot;

/** Local calendar date as YYYY-MM-DD. */
export const localDate = (now: number) => {
  const date = new Date(now);
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export type IssueListQueryParams = Readonly<
  Record<string, string | ReadonlyArray<string>>
>;

/**
 * Capy's list endpoint query for a filter set. Status filters stay
 * client-side: the list applies them per state section.
 */
export const issueListQuery = (
  filters: IssueFilters,
  search: string,
  today: string,
): IssueListQueryParams => {
  const flag = (value: boolean) => (value ? "1" : undefined);
  const list = (values: ReadonlyArray<string>) =>
    values.length === 0 ? undefined : values;
  const term = search.trim().slice(0, 100);
  const due = dueCount(filters) > 0;
  const query: Record<string, string | ReadonlyArray<string> | undefined> = {
    match:
      matchableCount(filters) > 1 && filters.match === "any"
        ? "any"
        : undefined,
    assigneeIds: list(filters.assignee.userIds),
    assigneeJamIds: list(filters.assignee.jamIds),
    unassigned: flag(filters.assignee.none),
    assigneeMe: flag(filters.assignee.me),
    assigneeCaptains: filters.assignee.captains ?? undefined,
    assigneeNot: flag(actorCount(filters.assignee) > 0 && filters.assigneeNot),
    creatorIds: list(filters.creator.userIds),
    creatorJamIds: list(filters.creator.jamIds),
    creatorMe: flag(filters.creator.me),
    creatorCaptains: filters.creator.captains ?? undefined,
    creatorNot: flag(actorCount(filters.creator) > 0 && filters.creatorNot),
    mentioned: flag(filters.mentioned),
    mentionedIds: list(filters.mentionedIds),
    mentionedNot: flag(mentionedCount(filters) > 0 && filters.mentionedNot),
    subscribed: flag(filters.subscribed),
    subscribedIds: list(filters.subscribedIds),
    subscribedNot: flag(subscribedCount(filters) > 0 && filters.subscribedNot),
    priorities: list(filters.priorities),
    prioritiesNot: flag(filters.priorities.length > 0 && filters.prioritiesNot),
    projectIds: list(filters.projectIds),
    projectIdsNot: flag(filters.projectIds.length > 0 && filters.projectIdsNot),
    labelIds: list(filters.labelIds),
    labelMatch:
      filters.labelIds.length > 0 && filters.labelMatch !== "any"
        ? filters.labelMatch
        : undefined,
    hasPull:
      filters.pull === null ? undefined : filters.pull === "linked" ? "1" : "0",
    relations: list(filters.relations),
    excludedRelations: list(filters.excludedRelations),
    due: list(filters.due),
    dueFrom: filters.dueFrom ?? undefined,
    dueTo: filters.dueTo ?? undefined,
    dueNot: flag(due && filters.dueNot),
    today: due ? today : undefined,
    search: term === "" ? undefined : term,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as IssueListQueryParams;
};
