import type { ReactNode } from "react";
import type { PullState } from "@/data/api/schemas/pull";
import {
  AuthorGlyph,
  CalendarClockGlyph,
  CalendarGlyph,
  DisplayGlyph,
  FilterGlyph,
  GroupingGlyph,
  ProjectGlyph,
  PullRequestGlyph,
  PullStateIcon,
  ThreadGlyph,
} from "@/features/pulls/pull-row/pull-icons";
import {
  type DatePreset,
  datePresetLabels,
  type Grouping,
  groupingLabels,
  type PullFilters,
  repoName,
  stateOptions,
  toggle,
} from "@/features/pulls/pulls-page/model";
import { Icon } from "@/primitives/icon";
import { Menu, MenuTrigger } from "@/primitives/menu";
import { cx, toolbarButton, viewTabActive } from "./classes";
import {
  FilterCount,
  MenuDivider,
  MenuPopup,
  MenuRowItem,
  MenuSubmenu,
  SearchableOptions,
} from "./menu-parts";

export interface FilterOption {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface AuthorOption {
  readonly login: string;
  readonly name: string;
  readonly imageUrl: string;
}

export interface PullFilterOptions {
  readonly projects: ReadonlyArray<FilterOption>;
  readonly repos: ReadonlyArray<string>;
  readonly authors: ReadonlyArray<AuthorOption>;
  readonly captains: ReadonlyArray<FilterOption>;
  readonly labels: ReadonlyArray<FilterOption>;
}

export function ViewTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-active={active ? "" : undefined}
      className={cx(
        toolbarButton,
        active && viewTabActive,
        "disabled:pointer-events-none disabled:opacity-55",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Tabs on the left, filter and display menus on the right (Capy's PullsPage header row). */
export function PullsToolbar({
  tabs,
  trailing,
}: {
  tabs: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-2 px-2">
      <div className="scrollbar-hide mask-fade-r-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1.5">
        {tabs}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
    </div>
  );
}

export function AuthorAvatar({ name, src }: { name: string; src: string }) {
  return src === "" ? (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.5625rem] font-medium text-muted-foreground-1 uppercase"
    >
      {name.slice(0, 1)}
    </span>
  ) : (
    <img alt="" src={src} className="size-4 shrink-0 rounded-full" />
  );
}

function DateSubmenu({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  value: DatePreset | null;
  onChange: (value: DatePreset | null) => void;
}) {
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={
        value === null ? (
          hint === undefined ? undefined : (
            <FilterCount filterKey={hint} />
          )
        ) : (
          datePresetLabels[value]
        )
      }
      contentClassName="w-44"
    >
      {(Object.keys(datePresetLabels) as Array<DatePreset>).map((preset) => (
        <MenuRowItem
          key={preset}
          label={datePresetLabels[preset]}
          checked={value === preset}
          closeOnClick={false}
          onClick={() => onChange(value === preset ? null : preset)}
        />
      ))}
    </MenuSubmenu>
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
  const ids = [...new Set([...options.map((option) => option.id), ...selected])];
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={hint === undefined ? count : <FilterCount filterKey={hint} value={count} />}
      contentClassName="w-56"
    >
      <SearchableOptions
        placeholder={`Find ${label.toLowerCase()}`}
        options={ids.map((id) => {
          const option = options.find((candidate) => candidate.id === id);
          return {
            key: id,
            label: option?.label ?? id,
            leading: option?.icon ?? icon,
            checked: selected.includes(id),
          };
        })}
        onToggle={(id) => onChange(toggle(selected, id))}
      />
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
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Filter pull requests"
            className={cx(toolbarButton, "w-(--h-control-sm) px-0")}
          />
        }
      >
        <FilterGlyph />
      </MenuTrigger>
      <MenuPopup align="end" className="w-56">
        <MenuSubmenu
          icon={<PullRequestGlyph />}
          label="State"
          value={
            <FilterCount
              filterKey="status"
              value={filters.states.length > 0 ? filters.states.length : undefined}
            />
          }
          contentClassName="w-44"
        >
          {stateOptions.map(({ value, label }) => (
            <MenuRowItem
              key={value}
              icon={<PullStateIcon state={value} />}
              label={label}
              checked={filters.states.includes(value)}
              closeOnClick={false}
              onClick={() =>
                onChange({ ...filters, states: toggle<PullState>(filters.states, value) })
              }
            />
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
            icon={<Icon name="github" />}
            label="Repository"
            hint="repo"
            selected={filters.repos}
            options={options.repos.map((repo) => ({
              id: repo,
              label: repoName(repo),
              icon: <Icon name="github" />,
            }))}
            onChange={(repos) => onChange({ ...filters, repos })}
          />
        ) : null}
        <OptionsSubmenu
          icon={<AuthorGlyph />}
          label="Author"
          hint="author"
          selected={filters.authors}
          options={options.authors.map((author) => ({
            id: author.login,
            label: author.name,
            icon: <AuthorAvatar name={author.name} src={author.imageUrl} />,
          }))}
          onChange={(authors) => onChange({ ...filters, authors })}
        />
        <OptionsSubmenu
          icon={<Icon name="agent" />}
          label="Captain"
          hint="captain"
          selected={filters.captains}
          options={options.captains}
          onChange={(captains) => onChange({ ...filters, captains })}
        />
        {options.labels.length === 0 && filters.labels.length === 0 ? null : (
          <OptionsSubmenu
            icon={<Icon name="ticket" />}
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
            filters.thread === null ? undefined : filters.thread === "linked" ? "Linked" : "None"
          }
          contentClassName="w-44"
        >
          {(["linked", "none"] as const).map((thread) => (
            <MenuRowItem
              key={thread}
              icon={thread === "linked" ? <ThreadGlyph /> : <Icon name="circle-dotted" />}
              label={thread === "linked" ? "Has thread" : "No thread"}
              checked={filters.thread === thread}
              closeOnClick={false}
              onClick={() =>
                onChange({ ...filters, thread: filters.thread === thread ? null : thread })
              }
            />
          ))}
        </MenuSubmenu>
        <DateSubmenu
          icon={<CalendarGlyph />}
          label="Created"
          value={filters.created}
          onChange={(created) => onChange({ ...filters, created })}
        />
        <DateSubmenu
          icon={<CalendarClockGlyph />}
          label="Since"
          hint="since"
          value={filters.updated}
          onChange={(updated) => onChange({ ...filters, updated })}
        />
        {clearable ? (
          <>
            <MenuDivider />
            <MenuRowItem
              icon={<Icon name="circle-dotted" />}
              label="Clear filters"
              closeOnClick={false}
              onClick={onClear}
            />
          </>
        ) : null}
      </MenuPopup>
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
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Display options"
            className={cx(toolbarButton, "w-(--h-control-sm) px-0")}
          />
        }
      >
        <DisplayGlyph />
      </MenuTrigger>
      <MenuPopup align="end" className="w-60">
        <MenuSubmenu
          icon={<GroupingGlyph />}
          label="Grouping"
          value={groupingLabels[grouping]}
          contentClassName="w-44"
        >
          {(Object.keys(groupingLabels) as Array<Grouping>).map((key) => (
            <MenuRowItem
              key={key}
              label={groupingLabels[key]}
              checked={grouping === key}
              onClick={() => onGrouping(key)}
            />
          ))}
        </MenuSubmenu>
        <MenuDivider />
        <MenuRowItem
          icon={<Icon name="circle-dotted" />}
          label="Show empty sections"
          checked={showEmptySections}
          closeOnClick={false}
          onClick={onToggleEmptySections}
        />
      </MenuPopup>
    </Menu>
  );
}
