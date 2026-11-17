import type { ReactNode } from "react";
import {
  cx,
  DateRangeSubmenu,
  DisplayChoiceSub,
  DisplayMenu,
  DisplayToggle,
  dateRangeLabel,
  type FilterChipModel,
  FilterKeyHint,
  MenuSubmenu,
  menuCheckClassName,
  menuIconSlotClassName,
  type ViewToolbarIcons,
  viewToolbarIconButtonClassName,
} from "@/components/view-toolbar";
import {
  AuthorGlyph,
  CalendarClockGlyph,
  CalendarGlyph,
  CheckGlyph,
  CrossGlyph,
  DisplayGlyph,
  FilterGlyph,
  GroupingGlyph,
  ProjectGlyph,
  PullRequestGlyph,
  PullStateIcon,
  ThreadGlyph,
} from "@/features/pulls/pulls-list/pull-row/pull-icons";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type PullState, repoName } from "./data/pull";
import {
  type Grouping,
  groupingLabels,
  isNegative,
  type NegativeAxis,
  type PullFilters,
  setNegative,
  stateOptions,
  summarize,
  toggle,
} from "./model";

export const toolbarIcons: ViewToolbarIcons = {
  check: <CheckGlyph />,
  remove: <CrossGlyph />,
  display: <DisplayGlyph />,
  calendar: <CalendarGlyph />,
};

export interface FilterOption {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface PullFilterOptions {
  readonly projects: ReadonlyArray<FilterOption>;
  readonly repos: ReadonlyArray<string>;
  readonly authors: ReadonlyArray<FilterOption>;
  readonly captains: ReadonlyArray<FilterOption>;
  readonly labels: ReadonlyArray<FilterOption>;
}

function CheckMark() {
  return (
    <span className={cx("ml-auto", menuCheckClassName)}>
      <CheckGlyph />
    </span>
  );
}

function OptionsSubmenu({
  icon,
  label,
  hint,
  selected,
  options,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  selected: ReadonlyArray<string>;
  options: ReadonlyArray<FilterOption>;
  onChange: (next: ReadonlyArray<string>) => void;
}) {
  const count = selected.length > 0 ? selected.length : undefined;
  const missing = selected
    .filter((id) => !options.some((option) => option.id === id))
    .map((id) => ({ id, label: id }));
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={
        hint === undefined ? count : <FilterKeyHint filterKey={hint} value={count} />
      }
      contentClassName="w-56"
    >
      {[...options, ...missing].map((option) => (
        <MenuItem
          key={option.id}
          closeOnClick={false}
          onClick={() => onChange(toggle(selected, option.id))}
        >
          <span className={menuIconSlotClassName}>{option.icon ?? icon}</span>
          <span className="min-w-0 truncate">{option.label}</span>
          {selected.includes(option.id) ? <CheckMark /> : null}
        </MenuItem>
      ))}
    </MenuSubmenu>
  );
}

/** The filter button's menu (Capy's PullsFilterMenu). */
export function PullsFilterMenu({
  filters,
  options,
  clearable,
  onChange,
  onClear,
}: {
  filters: PullFilters;
  options: PullFilterOptions;
  clearable: boolean;
  onChange: (filters: PullFilters) => void;
  onClear: () => void;
}) {
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Filter pull requests"
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
        <MenuSubmenu
          icon={<PullRequestGlyph />}
          label="State"
          value={
            <FilterKeyHint
              filterKey="status"
              value={filters.states.length > 0 ? filters.states.length : undefined}
            />
          }
          contentClassName="w-44"
        >
          {stateOptions.map(({ value, label }) => (
            <MenuItem
              key={value}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  states: toggle<PullState>(filters.states, value),
                })
              }
            >
              <span className={menuIconSlotClassName}>
                <PullStateIcon state={value} />
              </span>
              {label}
              {filters.states.includes(value) ? <CheckMark /> : null}
            </MenuItem>
          ))}
        </MenuSubmenu>
        <OptionsSubmenu
          icon={<ProjectGlyph />}
          label="Project"
          selected={filters.projects}
          options={options.projects}
          onChange={(projects) => onChange({ ...filters, projects })}
        />
        {options.repos.length > 1 ? (
          <OptionsSubmenu
            icon={<PullRequestGlyph />}
            label="Repository"
            hint="repo"
            selected={filters.repos}
            options={options.repos.map((repo) => ({
              id: repo,
              label: repoName(repo),
            }))}
            onChange={(repos) => onChange({ ...filters, repos })}
          />
        ) : null}
        <OptionsSubmenu
          icon={<AuthorGlyph />}
          label="Author"
          hint="author"
          selected={filters.authors}
          options={options.authors}
          onChange={(authors) => onChange({ ...filters, authors })}
        />
        <OptionsSubmenu
          icon={<AuthorGlyph />}
          label="Captain"
          hint="captain"
          selected={filters.captains}
          options={options.captains}
          onChange={(captains) => onChange({ ...filters, captains })}
        />
        {options.labels.length === 0 && filters.labels.length === 0 ? null : (
          <OptionsSubmenu
            icon={<ProjectGlyph />}
            label="Label"
            hint="label"
            selected={filters.labels}
            options={options.labels}
            onChange={(labels) => onChange({ ...filters, labels })}
          />
        )}
        <MenuSubmenu
          icon={<ThreadGlyph />}
          label="Thread"
          value={
            filters.thread === null
              ? undefined
              : filters.thread === "linked"
                ? "Linked"
                : "None"
          }
          contentClassName="w-44"
        >
          {(["linked", "none"] as const).map((thread) => (
            <MenuItem
              key={thread}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  thread: filters.thread === thread ? null : thread,
                })
              }
            >
              <span className={menuIconSlotClassName}>
                {thread === "linked" ? <ThreadGlyph /> : <CrossGlyph />}
              </span>
              {thread === "linked" ? "Has thread" : "No thread"}
              {filters.thread === thread ? <CheckMark /> : null}
            </MenuItem>
          ))}
        </MenuSubmenu>
        <DateRangeSubmenu
          icon={<CalendarGlyph />}
          label="Created"
          value={filters.created}
          onChange={(created) => onChange({ ...filters, created })}
          icons={toolbarIcons}
        />
        <DateRangeSubmenu
          icon={<CalendarClockGlyph />}
          label="Since"
          hint="since"
          value={filters.updated}
          onChange={(updated) => onChange({ ...filters, updated })}
          icons={toolbarIcons}
        />
        {clearable ? (
          <>
            <MenuSeparator />
            <MenuItem closeOnClick={false} onClick={onClear}>
              <span className={menuIconSlotClassName}>
                <CrossGlyph />
              </span>
              Clear filters
            </MenuItem>
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

/** The display button's menu (Capy's PullsDisplayMenu). */
export function PullsDisplayMenu({
  grouping,
  showEmptySections,
  onGrouping,
  onToggleEmptySections,
}: {
  grouping: Grouping;
  showEmptySections: boolean;
  onGrouping: (grouping: Grouping) => void;
  onToggleEmptySections: () => void;
}) {
  return (
    <DisplayMenu icon={<DisplayGlyph />}>
      <DisplayChoiceSub
        icon={<GroupingGlyph />}
        label="Grouping"
        labels={groupingLabels}
        value={grouping}
        onPick={onGrouping}
        icons={toolbarIcons}
      />
      <MenuSeparator />
      <DisplayToggle
        icon={<CrossGlyph />}
        label="Show empty sections"
        checked={showEmptySections}
        onToggle={onToggleEmptySections}
        icons={toolbarIcons}
      />
    </DisplayMenu>
  );
}

const binary = (
  filters: PullFilters,
  axis: NegativeAxis,
  count: number,
  onChange: (filters: PullFilters) => void,
) => ({
  kind: "binary" as const,
  agreement: "is" as const,
  cardinality: count > 1 ? ("many" as const) : ("one" as const),
  sign: isNegative(filters, axis) ? ("negative" as const) : ("positive" as const),
  onChange: (sign: "positive" | "negative") =>
    onChange(setNegative(filters, axis, sign === "negative")),
});

const nameOf = (options: ReadonlyArray<FilterOption>, id: string) =>
  options.find((option) => option.id === id)?.label ?? id;

/** One chip per active filter axis, in the filter menu's order. */
export const pullFilterChips = (
  filters: PullFilters,
  options: PullFilterOptions,
  onChange: (filters: PullFilters) => void,
): ReadonlyArray<FilterChipModel> => {
  const chips: Array<FilterChipModel> = [];
  if (filters.states.length > 0) {
    const labels = filters.states.map(
      (state) => stateOptions.find((option) => option.value === state)?.label ?? state,
    );
    chips.push({
      key: "states",
      icon: <PullRequestGlyph />,
      property: "State",
      operator: binary(filters, "states", filters.states.length, onChange),
      value: summarize(labels, "states"),
      selector: {
        ariaLabel: `Change state filter value, currently ${summarize(labels, "states")}`,
        contentClassName: "w-44",
        content: stateOptions.map(({ value, label }) => (
          <MenuItem
            key={value}
            closeOnClick={false}
            onClick={() =>
              onChange({ ...filters, states: toggle(filters.states, value) })
            }
          >
            <span className={menuIconSlotClassName}>
              <PullStateIcon state={value} />
            </span>
            {label}
            {filters.states.includes(value) ? <CheckMark /> : null}
          </MenuItem>
        )),
      },
      onRemove: () =>
        onChange(setNegative({ ...filters, states: [] }, "states", false)),
    });
  }
  const listChip = (
    key: "projects" | "repos" | "authors",
    property: string,
    noun: string,
    icon: ReactNode,
    list: ReadonlyArray<FilterOption>,
  ) => {
    const selected = filters[key];
    if (selected.length === 0) return;
    chips.push({
      key,
      icon,
      property,
      operator: binary(filters, key, selected.length, onChange),
      value: summarize(
        selected.map((id) => nameOf(list, id)),
        noun,
      ),
      onRemove: () => onChange(setNegative({ ...filters, [key]: [] }, key, false)),
    });
  };
  listChip("projects", "Project", "projects", <ProjectGlyph />, options.projects);
  listChip(
    "repos",
    "Repository",
    "repositories",
    <PullRequestGlyph />,
    options.repos.map((repo) => ({ id: repo, label: repoName(repo) })),
  );
  listChip("authors", "Author", "authors", <AuthorGlyph />, options.authors);
  if (filters.captains.length > 0) {
    chips.push({
      key: "captains",
      icon: <AuthorGlyph />,
      property: "Captain",
      operator: filters.captains.length > 1 ? "is either of" : "is",
      value: summarize(
        filters.captains.map((id) => nameOf(options.captains, id)),
        "captains",
      ),
      onRemove: () => onChange({ ...filters, captains: [] }),
    });
  }
  if (filters.labels.length > 0) {
    chips.push({
      key: "labels",
      icon: <ProjectGlyph />,
      property: "Label",
      operator: filters.labels.length > 1 ? "is either of" : "is",
      value: summarize(
        filters.labels.map((id) => nameOf(options.labels, id)),
        "labels",
      ),
      onRemove: () => onChange({ ...filters, labels: [] }),
    });
  }
  if (filters.thread !== null) {
    chips.push({
      key: "thread",
      icon: <ThreadGlyph />,
      property: "Thread",
      operator: binary(filters, "thread", 1, onChange),
      value: filters.thread === "linked" ? "Linked" : "None",
      onRemove: () =>
        onChange(setNegative({ ...filters, thread: null }, "thread", false)),
    });
  }
  const dateChip = (
    key: "created" | "updated",
    property: string,
    icon: ReactNode,
  ) => {
    const range = filters[key];
    if (range === null) return;
    chips.push({
      key,
      icon,
      property,
      operator: binary(filters, key, 1, onChange),
      value: dateRangeLabel(range),
      onRemove: () => onChange(setNegative({ ...filters, [key]: null }, key, false)),
    });
  };
  dateChip("created", "Created", <CalendarGlyph />);
  dateChip("updated", "Since", <CalendarClockGlyph />);
  return chips;
};
