import type { ReactNode } from "react";
import {
  AuthorGlyph,
  CalendarClockGlyph,
  CalendarGlyph,
  CrossGlyph,
  ProjectGlyph,
  PullRequestGlyph,
  PullStateIcon,
  ThreadGlyph,
} from "@/features/pulls/pull-row/pull-icons";
import {
  type DatePreset,
  datePresetLabels,
  type NegativeAxis,
  type PullFilters,
  repoName,
  stateOptions,
  summarize,
  toggle,
} from "@/features/pulls/pulls-page/model";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuTrigger } from "@/primitives/menu";
import { chipButton, chipSegment, cx, hairline } from "./classes";
import { MenuPopup, MenuRowItem, SearchableOptions } from "./menu-parts";
import { AuthorAvatar, type PullFilterOptions } from "./pulls-toolbar";

export interface FilterChip {
  readonly key: NegativeAxis;
  readonly icon: ReactNode;
  readonly property: string;
  readonly cardinality: "one" | "many";
  readonly negative: boolean;
  readonly value: string;
  readonly selector: ReactNode;
  readonly selectorClassName: string;
  readonly onNegate: (negative: boolean) => void;
  readonly onRemove: () => void;
}

/** "is" / "is either of" / "is not" (Capy's NIt for a binary operator). */
export const operatorLabel = (
  cardinality: "one" | "many",
  negative: boolean,
) => (negative ? "is not" : cardinality === "one" ? "is" : "is either of");

/** The chips for the active filters (Capy's `pullFilterChips`). */
export const pullFilterChips = (
  filters: PullFilters,
  onChange: (filters: PullFilters) => void,
  options: PullFilterOptions,
): ReadonlyArray<FilterChip> => {
  const negativeOf = (axis: NegativeAxis) => filters.negativeAxes.includes(axis);
  const without = (axis: NegativeAxis) =>
    filters.negativeAxes.filter((candidate) => candidate !== axis);
  const base = (axis: NegativeAxis, many: boolean) => ({
    key: axis,
    cardinality: many ? ("many" as const) : ("one" as const),
    negative: negativeOf(axis),
    onNegate: (negative: boolean) =>
      onChange({
        ...filters,
        negativeAxes: negative ? [...new Set([...filters.negativeAxes, axis])] : without(axis),
      }),
  });
  const remove = (axis: NegativeAxis, next: Partial<PullFilters>) => () =>
    onChange({ ...filters, ...next, negativeAxes: without(axis) });
  const chips: Array<FilterChip> = [];

  if (filters.states.length > 0) {
    chips.push({
      ...base("states", filters.states.length > 1),
      icon: <PullRequestGlyph />,
      property: "State",
      value: summarize(
        filters.states.map(
          (state) => stateOptions.find((option) => option.value === state)?.label ?? state,
        ),
        "states",
      ),
      selectorClassName: "w-44",
      selector: stateOptions.map(({ value, label }) => (
        <MenuRowItem
          key={value}
          icon={<PullStateIcon state={value} />}
          label={label}
          checked={filters.states.includes(value)}
          closeOnClick={false}
          onClick={() => onChange({ ...filters, states: toggle(filters.states, value) })}
        />
      )),
      onRemove: remove("states", { states: [] }),
    });
  }
  if (filters.projects.length > 0) {
    const name = (id: string) =>
      options.projects.find((project) => project.id === id)?.label ?? id;
    chips.push({
      ...base("projects", filters.projects.length > 1),
      icon: <ProjectGlyph />,
      property: "Project",
      value: summarize(filters.projects.map(name), "projects"),
      selectorClassName: "w-56",
      selector: (
        <SearchableOptions
          placeholder="Find project"
          options={options.projects.map((project) => ({
            key: project.id,
            label: project.label,
            leading: project.icon,
            checked: filters.projects.includes(project.id),
          }))}
          onToggle={(id) => onChange({ ...filters, projects: toggle(filters.projects, id) })}
        />
      ),
      onRemove: remove("projects", { projects: [] }),
    });
  }
  if (filters.repos.length > 0) {
    chips.push({
      ...base("repos", filters.repos.length > 1),
      icon: <Icon name="github" />,
      property: "Repository",
      value: summarize(filters.repos.map(repoName), "repos"),
      selectorClassName: "w-56",
      selector: (
        <SearchableOptions
          placeholder="Find repository"
          options={options.repos.map((repo) => ({
            key: repo,
            label: repoName(repo),
            leading: <Icon name="github" />,
            checked: filters.repos.includes(repo),
          }))}
          onToggle={(repo) => onChange({ ...filters, repos: toggle(filters.repos, repo) })}
        />
      ),
      onRemove: remove("repos", { repos: [] }),
    });
  }
  if (filters.authors.length > 0) {
    const name = (login: string) =>
      options.authors.find((author) => author.login === login)?.name ?? login;
    chips.push({
      ...base("authors", filters.authors.length > 1),
      icon: <AuthorGlyph />,
      property: "Author",
      value: summarize(filters.authors.map(name), "authors"),
      selectorClassName: "w-56",
      selector: (
        <SearchableOptions
          placeholder="Find member"
          options={options.authors.map((author) => ({
            key: author.login,
            label: author.name,
            leading: <AuthorAvatar name={author.name} src={author.imageUrl} />,
            checked: filters.authors.includes(author.login),
          }))}
          onToggle={(login) => onChange({ ...filters, authors: toggle(filters.authors, login) })}
        />
      ),
      onRemove: remove("authors", { authors: [] }),
    });
  }
  if (filters.thread !== null) {
    chips.push({
      ...base("thread", false),
      icon: <ThreadGlyph />,
      property: "Thread",
      value: filters.thread === "linked" ? "Linked" : "None",
      selectorClassName: "w-44",
      selector: (["linked", "none"] as const).map((thread) => (
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
      )),
      onRemove: remove("thread", { thread: null }),
    });
  }
  const dateChip = (
    axis: "created" | "updated",
    property: string,
    icon: ReactNode,
    value: DatePreset,
  ) => ({
    ...base(axis, false),
    icon,
    property,
    value: datePresetLabels[value],
    selectorClassName: "w-44",
    selector: (Object.keys(datePresetLabels) as Array<DatePreset>).map((preset) => (
      <MenuRowItem
        key={preset}
        label={datePresetLabels[preset]}
        checked={value === preset}
        onClick={() => onChange({ ...filters, [axis]: preset })}
      />
    )),
    onRemove: remove(axis, { [axis]: null }),
  });
  if (filters.created !== null) {
    chips.push(dateChip("created", "Created", <CalendarGlyph />, filters.created));
  }
  if (filters.updated !== null) {
    chips.push(dateChip("updated", "Since", <CalendarClockGlyph />, filters.updated));
  }
  return chips;
};

function FilterChipView({ chip }: { chip: FilterChip }) {
  const operator = operatorLabel(chip.cardinality, chip.negative);
  return (
    <span
      className={cx(
        "flex h-6 max-w-full shrink-0 items-center overflow-clip rounded",
        hairline,
        "border-border-2 bg-card text-xs font-normal whitespace-nowrap shadow-(--sh-plate)",
      )}
    >
      <span
        className={cx(chipSegment, "text-foreground [&_svg]:size-3 [&_svg]:text-icon-muted")}
      >
        {chip.icon}
        {chip.property}
      </span>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              aria-label={`Change ${chip.property} filter operator, currently ${operator}`}
              className={cx(chipButton, "text-muted-foreground-2 hover:text-foreground")}
            />
          }
        >
          {operator}
        </MenuTrigger>
        <MenuPopup className="w-32">
          {([false, true] as const).map((negative) => (
            <MenuRowItem
              key={String(negative)}
              label={operatorLabel(chip.cardinality, negative)}
              checked={chip.negative === negative}
              onClick={() => chip.onNegate(negative)}
            />
          ))}
        </MenuPopup>
      </Menu>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              aria-label={`Change ${chip.property} filter value, currently ${chip.value}`}
              className={cx(
                chipButton,
                "min-w-0 shrink overflow-hidden font-medium text-foreground",
              )}
            />
          }
        >
          {chip.value}
        </MenuTrigger>
        <MenuPopup className={chip.selectorClassName}>{chip.selector}</MenuPopup>
      </Menu>
      <button
        type="button"
        aria-label={`Remove ${chip.property} filter`}
        onMouseDown={(event) => event.preventDefault()}
        className={cx(chipButton, "text-muted-foreground-2 hover:text-foreground")}
        onClick={chip.onRemove}
      >
        <CrossGlyph className="size-3" />
      </button>
    </span>
  );
}

/** The chip row under the toolbar (Capy's FilterChipBar). */
export function FilterChipBar({
  chips,
  dirty,
  onClear,
  onSave,
}: {
  chips: ReadonlyArray<FilterChip>;
  dirty: boolean;
  onClear: () => void;
  onSave?: () => void;
}) {
  if (chips.length === 0 && !dirty) return null;
  return (
    <div className="flex shrink-0 items-center gap-2 px-2 pb-1.5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <FilterChipView key={chip.key} chip={chip} />
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {dirty ? (
          <>
            <Button variant="ghost" size="xs" onClick={onClear}>
              Clear
            </Button>
            {onSave === undefined ? null : (
              <Button variant="solid" size="xs" onClick={onSave}>
                Save
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
