import { type ReactNode, useState } from "react";
import {
  ActorFilterItems,
  ActorFilterValue,
  ActorRow,
  type ActorSources,
  MenuSearchInput,
} from "@/components/actor-filter";
import {
  type FilterChipModel,
  MenuSubmenu,
  menuCheckClassName,
  menuIconSlotClassName,
  viewToolbarIconButtonClassName,
} from "@/components/view-toolbar";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  AtGlyph,
  BellGlyph,
  CalendarGlyph,
  CheckGlyph,
  CloseGlyph,
  EyeOffGlyph,
  FilterGlyph,
  FlagGlyph,
  LinkGlyph,
  PersonEditGlyph,
  PersonGlyph,
  ProjectGlyph,
  PullRequestGlyph,
  StatusGlyph,
  TagGlyph,
} from "../issues-toolbar/glyphs";
import {
  type ActorFilter,
  type ActorToggle,
  actorCount,
  dueCount,
  emptyActorFilter,
  hasIssueFilters,
  type IssueDueBucket,
  type IssueFilters,
  type IssueLabelMatch,
  type IssueMatch,
  type IssuePullFilter,
  type IssueRelationFilter,
  issueDueBuckets,
  matchableCount,
  toggleActor,
  toggleValue,
} from "./filters";

export type FilterOption = {
  readonly key: string;
  readonly label: string;
  readonly leading?: ReactNode;
};

/** Everything the filter menu and chips offer, gathered by the page. */
export type IssueFilterSources = {
  readonly states: ReadonlyArray<FilterOption>;
  readonly priorities: ReadonlyArray<FilterOption>;
  readonly projects: ReadonlyArray<FilterOption>;
  readonly labels: ReadonlyArray<FilterOption>;
  readonly actors: ActorSources;
};

export const dueBucketLabels: Record<IssueDueBucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  this_week: "This week",
  next_week: "Next week",
  this_month: "This month",
  overdue: "Overdue",
  none: "No due date",
};

export const pullFilterOptions: ReadonlyArray<{
  value: IssuePullFilter;
  label: string;
  chip: string;
}> = [
  { value: "linked", label: "Has pull request", chip: "Linked" },
  { value: "none", label: "No pull request", chip: "None" },
];

export const relationFilterOptions: ReadonlyArray<{
  value: IssueRelationFilter;
  label: string;
  chip: string;
}> = [
  { value: "parent", label: "Parent issues", chip: "Parent" },
  { value: "sub_issue", label: "Sub-issues", chip: "Sub-issue" },
  { value: "blocked", label: "Blocked issues", chip: "Blocked" },
  { value: "blocking", label: "Blocking issues", chip: "Blocking" },
  { value: "related", label: "Related issues", chip: "Related" },
  { value: "has_relations", label: "Has relations", chip: "Any relation" },
];

export const labelMatchOptions: ReadonlyArray<{
  value: IssueLabelMatch;
  label: string;
}> = [
  { value: "any", label: "includes any of" },
  { value: "all", label: "includes all of" },
  { value: "none", label: "includes none of" },
];

export const matchOptions: ReadonlyArray<{ value: IssueMatch; label: string }> =
  [
    { value: "all", label: "All filters" },
    { value: "any", label: "Any filter" },
  ];

type ListKey = "stateIds" | "priorities" | "projectIds" | "labelIds";

type ListFilter = {
  readonly key: ListKey;
  readonly label: string;
  readonly noun: string;
  readonly icon: ReactNode;
  readonly options: ReadonlyArray<FilterOption>;
  readonly negation?: "stateNot" | "prioritiesNot" | "projectIdsNot";
};

const listFilters = (
  sources: IssueFilterSources,
): ReadonlyArray<ListFilter> => [
  {
    key: "stateIds",
    label: "Status",
    noun: "statuses",
    icon: <StatusGlyph />,
    options: sources.states,
    negation: "stateNot",
  },
  {
    key: "priorities",
    label: "Priority",
    noun: "priorities",
    icon: <FlagGlyph />,
    options: sources.priorities,
    negation: "prioritiesNot",
  },
  {
    key: "projectIds",
    label: "Project",
    noun: "projects",
    icon: <ProjectGlyph />,
    options: sources.projects,
    negation: "projectIdsNot",
  },
  {
    key: "labelIds",
    label: "Label",
    noun: "labels",
    icon: <TagGlyph />,
    options: sources.labels,
  },
];

const clearList = (filters: IssueFilters, filter: ListFilter): IssueFilters =>
  filter.key === "labelIds"
    ? { ...filters, labelIds: [], labelMatch: "any" }
    : {
        ...filters,
        [filter.key]: [],
        ...(filter.negation === undefined ? {} : { [filter.negation]: false }),
      };

type ActorKind = {
  readonly key: "assignee" | "creator";
  readonly negation: "assigneeNot" | "creatorNot";
  readonly label: string;
  readonly noun: string;
  readonly icon: ReactNode;
  readonly noneLabel?: string;
};

const actorKinds: ReadonlyArray<ActorKind> = [
  {
    key: "assignee",
    negation: "assigneeNot",
    label: "Assignee",
    noun: "assignees",
    icon: <PersonGlyph />,
    noneLabel: "No assignee",
  },
  {
    key: "creator",
    negation: "creatorNot",
    label: "Creator",
    noun: "creators",
    icon: <PersonEditGlyph />,
  },
];

type PeopleKind = {
  readonly key: "mentioned" | "subscribed";
  readonly label: string;
  readonly icon: ReactNode;
};

const peopleKinds: ReadonlyArray<PeopleKind> = [
  { key: "mentioned", label: "Mentions", icon: <AtGlyph /> },
  { key: "subscribed", label: "Subscribers", icon: <BellGlyph /> },
];

/** Mentions and subscribers as an actor filter: "me" plus user ids. */
const peopleFilter = (filters: IssueFilters, kind: PeopleKind): ActorFilter =>
  kind.key === "mentioned"
    ? {
        ...emptyActorFilter,
        me: filters.mentioned,
        userIds: filters.mentionedIds,
      }
    : {
        ...emptyActorFilter,
        me: filters.subscribed,
        userIds: filters.subscribedIds,
      };

const peopleNot = (filters: IssueFilters, kind: PeopleKind) =>
  kind.key === "mentioned" ? filters.mentionedNot : filters.subscribedNot;

const withPeople = (
  filters: IssueFilters,
  kind: PeopleKind,
  next: ActorFilter,
  not: boolean,
): IssueFilters =>
  kind.key === "mentioned"
    ? {
        ...filters,
        mentioned: next.me,
        mentionedIds: next.userIds,
        mentionedNot: not,
      }
    : {
        ...filters,
        subscribed: next.me,
        subscribedIds: next.userIds,
        subscribedNot: not,
      };

const withDue = (filters: IssueFilters, patch: Partial<IssueFilters>) => {
  const next = { ...filters, ...patch };
  return { ...next, dueNot: next.dueNot && dueCount(next) > 0 };
};

const check = <CheckGlyph className={`ml-auto ${menuCheckClassName}`} />;

/** Capy's CheckRow: optional icon, label, trailing check; keeps the menu open. */
export function CheckRow({
  leading,
  label,
  checked,
  onClick,
}: {
  leading?: ReactNode;
  label: ReactNode;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <MenuItem closeOnClick={false} onClick={onClick}>
      {leading === undefined ? null : (
        <span className={menuIconSlotClassName}>{leading}</span>
      )}
      {label}
      {checked ? check : null}
    </MenuItem>
  );
}

/** A searchable list of check rows (a filter's value picker). */
export function FilterOptionItems({
  placeholder,
  options,
  checked,
  onToggle,
}: {
  placeholder: string;
  options: ReadonlyArray<FilterOption>;
  checked: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = options.filter(
    (option) => needle === "" || option.label.toLowerCase().includes(needle),
  );
  return (
    <>
      <MenuSearchInput
        placeholder={placeholder}
        value={query}
        onChange={setQuery}
      />
      {shown.length === 0 ? (
        <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
          No results
        </div>
      ) : (
        shown.map((option) => (
          <ActorRow
            key={option.key}
            leading={option.leading}
            label={option.label}
            checked={checked(option.key)}
            onClick={() => onToggle(option.key)}
          />
        ))
      )}
    </>
  );
}

export function DueFilterItems({
  filters,
  onChange,
}: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
}) {
  return issueDueBuckets.map((bucket) => (
    <CheckRow
      key={bucket}
      leading={<CalendarGlyph />}
      label={dueBucketLabels[bucket]}
      checked={filters.due.includes(bucket)}
      onClick={() =>
        onChange(withDue(filters, { due: toggleValue(filters.due, bucket) }))
      }
    />
  ));
}

const toggleList = (
  filters: IssueFilters,
  filter: ListFilter,
  key: string,
): IssueFilters => ({
  ...filters,
  [filter.key]: toggleValue(filters[filter.key], key),
});

/** Capy's IssuesFilterMenu: the toolbar's filter button and its submenus. */
export function IssuesFilterMenu({
  filters,
  sources,
  onChange,
  onClear,
}: {
  filters: IssueFilters;
  sources: IssueFilterSources;
  onChange: (filters: IssueFilters) => void;
  onClear: () => void;
}) {
  const lists = listFilters(sources);
  const listSubmenu = (filter: ListFilter) => (
    <MenuSubmenu
      key={filter.key}
      icon={filter.icon}
      label={filter.label}
      value={
        filters[filter.key].length > 0 ? filters[filter.key].length : undefined
      }
      contentClassName="w-56"
    >
      <FilterOptionItems
        placeholder={`Find ${filter.label.toLowerCase()}`}
        options={filter.options}
        checked={(key) => filters[filter.key].includes(key)}
        onToggle={(key) => onChange(toggleList(filters, filter, key))}
      />
    </MenuSubmenu>
  );
  const actorSubmenu = (kind: ActorKind) => (
    <MenuSubmenu
      key={kind.key}
      icon={kind.icon}
      label={kind.label}
      value={
        actorCount(filters[kind.key]) > 0
          ? actorCount(filters[kind.key])
          : undefined
      }
      contentClassName="w-72"
    >
      <ActorFilterItems
        placeholder={`Find ${kind.label.toLowerCase()}`}
        filter={filters[kind.key]}
        noneLabel={kind.noneLabel}
        sources={sources.actors}
        onToggle={(toggle: ActorToggle) =>
          onChange({
            ...filters,
            [kind.key]: toggleActor(filters[kind.key], toggle),
          })
        }
      />
    </MenuSubmenu>
  );
  const peopleSubmenu = (kind: PeopleKind) => {
    const current = peopleFilter(filters, kind);
    return (
      <MenuSubmenu
        key={kind.key}
        icon={kind.icon}
        label={kind.label}
        value={actorCount(current) > 0 ? actorCount(current) : undefined}
        contentClassName="w-56"
      >
        <PeopleItems
          filter={current}
          sources={sources.actors}
          onToggle={(toggle) =>
            onChange(
              withPeople(
                filters,
                kind,
                toggleActor(current, toggle),
                peopleNot(filters, kind),
              ),
            )
          }
        />
      </MenuSubmenu>
    );
  };
  const relationCount =
    filters.relations.length + filters.excludedRelations.length;
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Filter issues"
                  className={viewToolbarIconButtonClassName}
                />
              }
            />
          }
        >
          <FilterGlyph />
        </TooltipTrigger>
        <TooltipContent side="bottom">Filter</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-56">
        {listSubmenu(lists[0] as ListFilter)}
        {listSubmenu(lists[1] as ListFilter)}
        <MenuSubmenu
          icon={<CalendarGlyph />}
          label="Due date"
          value={dueCount(filters) > 0 ? dueCount(filters) : undefined}
          contentClassName="w-72"
        >
          <DueFilterItems filters={filters} onChange={onChange} />
        </MenuSubmenu>
        {actorKinds.map(actorSubmenu)}
        {peopleKinds.map(peopleSubmenu)}
        {listSubmenu(lists[2] as ListFilter)}
        {listSubmenu(lists[3] as ListFilter)}
        <MenuSubmenu
          icon={<LinkGlyph />}
          label="Relations"
          value={relationCount > 0 ? relationCount : undefined}
          contentClassName="w-56"
        >
          {relationFilterOptions.map((option) => {
            const on =
              filters.relations.includes(option.value) ||
              filters.excludedRelations.includes(option.value);
            return (
              <CheckRow
                key={option.value}
                leading={<LinkGlyph />}
                label={option.label}
                checked={on}
                onClick={() =>
                  onChange(
                    on
                      ? withoutRelation(filters, option.value)
                      : {
                          ...filters,
                          relations: [...filters.relations, option.value],
                        },
                  )
                }
              />
            );
          })}
        </MenuSubmenu>
        <MenuSubmenu
          icon={<PullRequestGlyph />}
          label="Pull request"
          value={
            pullFilterOptions.find((option) => option.value === filters.pull)
              ?.chip
          }
          contentClassName="w-48"
        >
          {pullFilterOptions.map((option) => (
            <CheckRow
              key={option.value}
              leading={
                option.value === "linked" ? (
                  <PullRequestGlyph />
                ) : (
                  <CloseGlyph />
                )
              }
              label={option.label}
              checked={filters.pull === option.value}
              onClick={() =>
                onChange({
                  ...filters,
                  pull: filters.pull === option.value ? null : option.value,
                })
              }
            />
          ))}
        </MenuSubmenu>
        <MenuSeparator />
        <CheckRow
          leading={<EyeOffGlyph />}
          label="Hide closed sub-issues"
          checked={filters.hideClosedSubIssues}
          onClick={() =>
            onChange({
              ...filters,
              hideClosedSubIssues: !filters.hideClosedSubIssues,
            })
          }
        />
        {hasIssueFilters(filters) ? (
          <>
            <MenuSeparator />
            <MenuItem closeOnClick={false} onClick={onClear}>
              <span className={menuIconSlotClassName}>
                <CloseGlyph />
              </span>
              Clear filters
            </MenuItem>
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

function PeopleItems({
  filter,
  sources,
  onToggle,
}: {
  filter: ActorFilter;
  sources: ActorSources;
  onToggle: (toggle: ActorToggle) => void;
}) {
  return (
    <FilterOptionItems
      placeholder="Find people"
      options={[
        { key: "", label: "Me", leading: sources.me?.icon ?? <PersonGlyph /> },
        ...sources.people
          .filter((person) => person.id !== sources.me?.id)
          .map((person) => ({
            key: person.id,
            label: person.label,
            leading: person.icon,
          })),
      ]}
      checked={(key) => (key === "" ? filter.me : filter.userIds.includes(key))}
      onToggle={(key) =>
        onToggle(key === "" ? { kind: "me" } : { kind: "user", id: key })
      }
    />
  );
}

const withoutRelation = (
  filters: IssueFilters,
  value: IssueRelationFilter,
): IssueFilters => ({
  ...filters,
  relations: filters.relations.filter((candidate) => candidate !== value),
  excludedRelations: filters.excludedRelations.filter(
    (candidate) => candidate !== value,
  ),
});

const summarize = (labels: ReadonlyArray<string>, noun: string) =>
  labels.length <= 2 ? labels.join(", ") : `${labels.length} ${noun}`;

/** Capy's useIssueFilterChips: one chip per active filter, in menu order. */
export function issueFilterChips(
  filters: IssueFilters,
  sources: IssueFilterSources,
  onChange: (filters: IssueFilters) => void,
): ReadonlyArray<FilterChipModel> {
  const [states, priorities, projects, labels] = listFilters(sources) as [
    ListFilter,
    ListFilter,
    ListFilter,
    ListFilter,
  ];
  const listChip = (filter: ListFilter): ReadonlyArray<FilterChipModel> => {
    const values = filters[filter.key];
    if (values.length === 0) return [];
    const value = summarize(
      values.map(
        (key) =>
          filter.options.find((option) => option.key === key)?.label ?? key,
      ),
      filter.noun,
    );
    const negation = filter.negation;
    return [
      {
        key: filter.key,
        icon: filter.icon,
        property: filter.label,
        operator:
          negation === undefined && values.length > 1
            ? {
                kind: "choice",
                current: filters.labelMatch,
                options: labelMatchOptions,
                onPick: (pick) =>
                  onChange({
                    ...filters,
                    labelMatch:
                      pick === "all" || pick === "none" ? pick : "any",
                  }),
              }
            : {
                kind: "binary",
                agreement: "is",
                cardinality: values.length === 1 ? "one" : "many",
                sign: (
                  negation === undefined
                    ? filters.labelMatch === "none"
                    : filters[negation]
                )
                  ? "negative"
                  : "positive",
                onChange: (sign) =>
                  onChange(
                    negation === undefined
                      ? {
                          ...filters,
                          labelMatch: sign === "negative" ? "none" : "any",
                        }
                      : { ...filters, [negation]: sign === "negative" },
                  ),
              },
        value,
        selector: {
          ariaLabel: `Change ${filter.label} filter value, currently ${value}`,
          content: (
            <FilterOptionItems
              placeholder={`Find ${filter.label.toLowerCase()}`}
              options={filter.options}
              checked={(key) => values.includes(key)}
              onToggle={(key) => onChange(toggleList(filters, filter, key))}
            />
          ),
          contentClassName: "w-56",
        },
        onRemove: () => onChange(clearList(filters, filter)),
      },
    ];
  };
  const actorChip = (kind: ActorKind): ReadonlyArray<FilterChipModel> => {
    const filter = filters[kind.key];
    const count = actorCount(filter);
    if (count === 0) return [];
    return [
      {
        key: kind.key,
        icon: kind.icon,
        property: kind.label,
        operator: {
          kind: "binary",
          agreement: "is",
          cardinality: count === 1 ? "one" : "many",
          sign: filters[kind.negation] ? "negative" : "positive",
          onChange: (sign) =>
            onChange({ ...filters, [kind.negation]: sign === "negative" }),
        },
        value: (
          <ActorFilterValue
            filter={filter}
            noun={kind.noun}
            noneLabel={kind.noneLabel}
            sources={sources.actors}
          />
        ),
        selector: {
          ariaLabel: `Change ${kind.label} filter value`,
          content: (
            <ActorFilterItems
              placeholder={`Find ${kind.label.toLowerCase()}`}
              filter={filter}
              noneLabel={kind.noneLabel}
              sources={sources.actors}
              onToggle={(toggle) =>
                onChange({
                  ...filters,
                  [kind.key]: toggleActor(filter, toggle),
                })
              }
            />
          ),
          contentClassName: "w-72",
        },
        onRemove: () =>
          onChange({
            ...filters,
            [kind.key]: emptyActorFilter,
            [kind.negation]: false,
          }),
      },
    ];
  };
  const peopleChip = (kind: PeopleKind): ReadonlyArray<FilterChipModel> => {
    const filter = peopleFilter(filters, kind);
    const not = peopleNot(filters, kind);
    const count = actorCount(filter);
    if (count === 0) return [];
    return [
      {
        key: kind.key,
        icon: kind.icon,
        property: kind.label,
        operator: {
          kind: "binary",
          agreement: "is",
          cardinality: count === 1 ? "one" : "many",
          sign: not ? "negative" : "positive",
          onChange: (sign) =>
            onChange(withPeople(filters, kind, filter, sign === "negative")),
        },
        value: (
          <ActorFilterValue
            filter={filter}
            noun="people"
            meLabel="You"
            sources={sources.actors}
          />
        ),
        selector: {
          ariaLabel: `Change ${kind.label} filter value`,
          content: (
            <PeopleItems
              filter={filter}
              sources={sources.actors}
              onToggle={(toggle) =>
                onChange(
                  withPeople(filters, kind, toggleActor(filter, toggle), not),
                )
              }
            />
          ),
          contentClassName: "w-56",
        },
        onRemove: () =>
          onChange(withPeople(filters, kind, emptyActorFilter, false)),
      },
    ];
  };
  const dueLabels = [
    ...issueDueBuckets
      .filter((bucket) => filters.due.includes(bucket))
      .map((bucket) => dueBucketLabels[bucket]),
    ...(filters.dueFrom === null && filters.dueTo === null
      ? []
      : [
          [filters.dueFrom, filters.dueTo]
            .filter((day) => day !== null)
            .join(" – "),
        ]),
  ];
  const dueValue =
    dueLabels.length <= 2
      ? dueLabels.join(", ")
      : `${dueLabels.length} due dates`;
  const dueChip: ReadonlyArray<FilterChipModel> =
    dueLabels.length === 0
      ? []
      : [
          {
            key: "due",
            icon: <CalendarGlyph />,
            property: "Due date",
            operator: {
              kind: "binary",
              agreement: "is",
              cardinality: dueLabels.length === 1 ? "one" : "many",
              sign: filters.dueNot ? "negative" : "positive",
              onChange: (sign) =>
                onChange({ ...filters, dueNot: sign === "negative" }),
            },
            value: dueValue,
            selector: {
              ariaLabel: `Change Due date filter value, currently ${dueValue}`,
              content: <DueFilterItems filters={filters} onChange={onChange} />,
              contentClassName: "w-72",
            },
            onRemove: () =>
              onChange({
                ...filters,
                due: [],
                dueFrom: null,
                dueTo: null,
                dueNot: false,
              }),
          },
        ];
  const relationChips = relationFilterOptions.flatMap(
    (option): ReadonlyArray<FilterChipModel> => {
      const excluded = filters.excludedRelations.includes(option.value);
      if (!excluded && !filters.relations.includes(option.value)) return [];
      return [
        {
          key: `relation:${option.value}`,
          icon: <LinkGlyph />,
          property: "Relation",
          operator: {
            kind: "binary",
            agreement: "is",
            cardinality: "one",
            sign: excluded ? "negative" : "positive",
            onChange: (sign) => {
              const base = withoutRelation(filters, option.value);
              onChange(
                sign === "negative"
                  ? {
                      ...base,
                      excludedRelations: [
                        ...base.excludedRelations,
                        option.value,
                      ],
                    }
                  : { ...base, relations: [...base.relations, option.value] },
              );
            },
          },
          value: option.chip,
          onRemove: () => onChange(withoutRelation(filters, option.value)),
        },
      ];
    },
  );
  const pull = pullFilterOptions.find(
    (option) => option.value === filters.pull,
  );
  const pullChip: ReadonlyArray<FilterChipModel> =
    pull === undefined
      ? []
      : [
          {
            key: "pull",
            icon: <PullRequestGlyph />,
            property: "Pull request",
            operator: { kind: "fixed", label: "is" },
            value: pull.chip,
            selector: {
              ariaLabel: `Change Pull request filter value, currently ${pull.chip}`,
              content: pullFilterOptions.map((option) => (
                <CheckRow
                  key={option.value}
                  leading={
                    option.value === "linked" ? (
                      <PullRequestGlyph />
                    ) : (
                      <CloseGlyph />
                    )
                  }
                  label={option.label}
                  checked={filters.pull === option.value}
                  onClick={() => onChange({ ...filters, pull: option.value })}
                />
              )),
              contentClassName: "w-48",
            },
            onRemove: () => onChange({ ...filters, pull: null }),
          },
        ];
  const subIssueChip: ReadonlyArray<FilterChipModel> =
    filters.hideClosedSubIssues
      ? [
          {
            key: "subissues",
            icon: <EyeOffGlyph />,
            property: "Sub-issues",
            operator: { kind: "fixed", label: "are not" },
            value: "Closed",
            onRemove: () =>
              onChange({ ...filters, hideClosedSubIssues: false }),
          },
        ]
      : [];
  return [
    ...listChip(states),
    ...listChip(priorities),
    ...dueChip,
    ...actorKinds.flatMap(actorChip),
    ...peopleKinds.flatMap(peopleChip),
    ...listChip(projects),
    ...listChip(labels),
    ...relationChips,
    ...pullChip,
    ...subIssueChip,
  ];
}

/** Capy's match chip: "Match All filters / Any filter", shown with 2+ people filters. */
export function IssuesMatchChip({
  filters,
  onChange,
}: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
}) {
  if (matchableCount(filters) < 2) return null;
  const current = matchOptions.find((option) => option.value === filters.match);
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Change filter match, currently ${current?.label}`}
        className="inline-flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded px-1.5 text-xs font-medium whitespace-nowrap text-foreground outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset"
      >
        <span className="font-normal text-muted-foreground-2">Match</span>
        {current?.label}
      </MenuTrigger>
      <MenuContent align="start" className="w-40">
        {matchOptions.map((option) => (
          <CheckRow
            key={option.value}
            label={option.label}
            checked={option.value === filters.match}
            onClick={() => onChange({ ...filters, match: option.value })}
          />
        ))}
      </MenuContent>
    </Menu>
  );
}
