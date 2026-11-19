import { type ReactNode, useState } from "react";
import {
  cx,
  DateRangeItems,
  DateRangeSubmenu,
  type FilterChipModel,
  type FilterSign,
  MenuSubmenu,
  menuCheckClassName,
  menuIconSlotClassName,
  viewTabClassName,
} from "@/components/view-toolbar";
import { dateRangeLabel } from "@/components/view-toolbar/date-range";
import { Icon } from "@/primitives/icon";
import { MenuSearchRow } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { InitialsAvatar } from "../automations-list/automations-list";
import {
  Box,
  Calendar,
  Checkmark,
  CrossMedium,
  Filter,
  UserEdit,
} from "../automations-list/glyphs";
import {
  TriggerIcon,
  type TriggerType,
  triggerTypeLabels,
  triggerTypes,
} from "../automations-list/triggers";
import {
  type AutomationFilters,
  type AutomationStatus,
  type FilterAxis,
  statusLabels,
} from "./filters";

const track = (owner: string) =>
  `features/automations/automations-page.tsx#${owner}`;

export type FilterOptionItem = {
  readonly key: string;
  readonly label: string;
  readonly leading?: ReactNode;
  readonly checked: boolean;
};

export type CreatorOption = {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
};

export type ProjectOption = { readonly id: string; readonly name: string };

export const toggleValue = <A,>(values: ReadonlyArray<A>, value: A) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

const check = (checked: boolean) =>
  checked ? (
    <span className={cx("ml-auto", menuCheckClassName)}>
      <Checkmark className="size-full" />
    </span>
  ) : null;

/** A search field over checkable options, as Capy's menu selector list. */
export function OptionSearchList({
  placeholder,
  options,
  onToggle,
}: {
  placeholder: string;
  options: ReadonlyArray<FilterOptionItem>;
  onToggle: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(needle),
  );
  return (
    <>
      <MenuSearchRow>
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground-3"
          placeholder={placeholder}
          aria-label={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") event.stopPropagation();
          }}
        />
      </MenuSearchRow>
      {visible.map((option) => (
        <ResponsiveMenuItem
          key={option.key}
          closeOnClick={false}
          onClick={() => onToggle(option.key)}
        >
          {option.leading === undefined ? null : (
            <span className={menuIconSlotClassName}>{option.leading}</span>
          )}
          <span className="min-w-0 truncate">{option.label}</span>
          {check(option.checked)}
        </ResponsiveMenuItem>
      ))}
    </>
  );
}

function SearchSubmenu({
  icon,
  label,
  count,
  placeholder,
  options,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  placeholder: string;
  options: ReadonlyArray<FilterOptionItem>;
  onToggle: (key: string) => void;
}) {
  return (
    <MenuSubmenu
      icon={icon}
      label={label}
      value={count > 0 ? count : undefined}
      contentClassName="w-56"
    >
      <OptionSearchList
        placeholder={placeholder}
        options={options}
        onToggle={onToggle}
      />
    </MenuSubmenu>
  );
}

function SourceItems({
  sources,
  onToggle,
}: {
  sources: ReadonlyArray<TriggerType>;
  onToggle: (type: TriggerType) => void;
}) {
  return triggerTypes.map((type) => (
    <ResponsiveMenuItem
      key={type}
      data-track-owner={track("AutomationsFilterMenu:ResponsiveMenuItem.1")}
      closeOnClick={false}
      onClick={() => onToggle(type)}
    >
      <span className={menuIconSlotClassName}>
        <TriggerIcon type={type} />
      </span>
      {triggerTypeLabels[type]}
      {check(sources.includes(type))}
    </ResponsiveMenuItem>
  ));
}

export function StatusItems({
  value,
  onChange,
}: {
  value: AutomationStatus | null;
  onChange: (value: AutomationStatus | null) => void;
}) {
  return (Object.keys(statusLabels) as AutomationStatus[]).map((status) => (
    <ResponsiveMenuItem
      key={status}
      data-track-owner={track("StatusItems:ResponsiveMenuItem.1")}
      closeOnClick={false}
      onClick={() => onChange(value === status ? null : status)}
    >
      {statusLabels[status]}
      {check(value === status)}
    </ResponsiveMenuItem>
  ));
}

const creatorOptions = (
  creators: ReadonlyArray<string> | null,
  options: ReadonlyArray<CreatorOption>,
  viewer: { name: string },
): FilterOptionItem[] => [
  {
    key: "__me",
    label: "Me",
    leading: <InitialsAvatar name={viewer.name} />,
    checked: creators === null,
  },
  ...options.map((option) => ({
    key: option.id,
    label: option.name,
    leading: <InitialsAvatar name={option.name} />,
    checked: creators?.includes(option.id) === true,
  })),
];

export type AutomationsFilterMenuProps = {
  filters: AutomationFilters;
  onChange: (filters: AutomationFilters) => void;
  projectOptions: ReadonlyArray<ProjectOption>;
  creatorOptions: ReadonlyArray<CreatorOption>;
  viewer: { name: string; imageUrl: string | null };
  onClear: () => void;
  clearable: boolean;
};

/** The funnel menu: Source, Project, Status, Creator and Created. */
export function AutomationsFilterMenu({
  filters,
  onChange,
  projectOptions,
  creatorOptions: creators,
  viewer,
  onClear,
  clearable,
}: AutomationsFilterMenuProps) {
  return (
    <ResponsiveMenu>
      <Tooltip>
        <TooltipTrigger
          data-track-owner={track("AutomationsFilterMenu:TooltipTrigger.1")}
          render={
            <ResponsiveMenuTrigger
              data-track-owner={track(
                "AutomationsFilterMenu:ResponsiveMenuTrigger.1",
              )}
              render={
                <button
                  data-track-owner={track(
                    "AutomationsFilterMenu:button[Filter automations]",
                  )}
                  type="button"
                  aria-label="Filter automations"
                  className={cx(viewTabClassName, "w-(--h-control-sm) px-0")}
                />
              }
            >
              <Filter />
            </ResponsiveMenuTrigger>
          }
        />
        <TooltipContent side="bottom">Filter</TooltipContent>
      </Tooltip>
      <ResponsiveMenuContent align="end" className="w-56">
        <MenuSubmenu
          icon={<Filter />}
          label="Source"
          value={
            filters.sources.length > 0 ? filters.sources.length : undefined
          }
          contentClassName="w-44"
        >
          <SourceItems
            sources={filters.sources}
            onToggle={(type) =>
              onChange({
                ...filters,
                sources: toggleValue(filters.sources, type),
              })
            }
          />
        </MenuSubmenu>
        <SearchSubmenu
          icon={<Box />}
          label="Project"
          count={filters.projects.length}
          placeholder="Find project"
          options={projectOptions.map((project) => ({
            key: project.id,
            label: project.name,
            checked: filters.projects.includes(project.id),
          }))}
          onToggle={(id) =>
            onChange({
              ...filters,
              projects: toggleValue(filters.projects, id),
            })
          }
        />
        <MenuSubmenu
          icon={<Icon name="toggle" />}
          label="Status"
          value={
            filters.status === null ? undefined : statusLabels[filters.status]
          }
          contentClassName="w-44"
        >
          <StatusItems
            value={filters.status}
            onChange={(status) => onChange({ ...filters, status })}
          />
        </MenuSubmenu>
        <SearchSubmenu
          icon={<UserEdit />}
          label="Creator"
          count={filters.creators === null ? 1 : filters.creators.length}
          placeholder="Find member"
          options={creatorOptions(filters.creators, creators, viewer)}
          onToggle={(key) =>
            onChange({
              ...filters,
              creators:
                key === "__me"
                  ? null
                  : toggleValue(filters.creators ?? [], key),
            })
          }
        />
        <DateRangeSubmenu
          icon={<Calendar />}
          label="Created"
          value={filters.created}
          onChange={(created) => onChange({ ...filters, created })}
          icons={{ calendar: <Calendar />, check: <Checkmark /> }}
        />
        {clearable ? (
          <>
            <ResponsiveMenuSeparator />
            <ResponsiveMenuItem
              data-track-owner={track(
                "AutomationsFilterMenu:ResponsiveMenuItem[Clear filters]",
              )}
              closeOnClick={false}
              onClick={onClear}
            >
              <span className={menuIconSlotClassName}>
                <CrossMedium />
              </span>
              Clear filters
            </ResponsiveMenuItem>
          </>
        ) : null}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

const summarize = (labels: ReadonlyArray<string>, noun: string) =>
  labels.length <= 2 ? labels.join(", ") : `${labels.length} ${noun}`;

/** Chips for every set filter, as Capy's automationFilterChips. */
export const automationFilterChips = (
  filters: AutomationFilters,
  onChange: (filters: AutomationFilters) => void,
  projects: ReadonlyArray<ProjectOption>,
  creators: ReadonlyArray<CreatorOption>,
  viewer: { name: string },
): FilterChipModel[] => {
  const withoutNegation = (axis: FilterAxis) =>
    filters.negativeAxes.filter((item) => item !== axis);
  const binary = (axis: FilterAxis, cardinality: "one" | "many") => ({
    kind: "binary" as const,
    sign: (filters.negativeAxes.includes(axis)
      ? "negative"
      : "positive") as FilterSign,
    agreement: "is" as const,
    cardinality,
    onChange: (sign: FilterSign) =>
      onChange({
        ...filters,
        negativeAxes:
          sign === "negative"
            ? [...new Set([...filters.negativeAxes, axis])]
            : withoutNegation(axis),
      }),
  });
  const remove = (axis: FilterAxis, next: AutomationFilters) =>
    onChange({
      ...next,
      negativeAxes: next.negativeAxes.filter((item) => item !== axis),
    });
  const selector = (
    property: string,
    value: string,
    content: ReactNode,
    contentClassName = "w-44",
  ) => ({
    ariaLabel: `Change ${property} filter value, currently ${value}`,
    content,
    contentClassName,
  });
  const chips: FilterChipModel[] = [];
  if (filters.sources.length > 0) {
    const value = summarize(
      filters.sources.map((type) => triggerTypeLabels[type]),
      "sources",
    );
    chips.push({
      key: "sources",
      icon: <TriggerIcon type={filters.sources[0] ?? "schedule"} />,
      property: "Source",
      operator: binary(
        "sources",
        filters.sources.length === 1 ? "one" : "many",
      ),
      value,
      selector: selector(
        "Source",
        value,
        <SourceItems
          sources={filters.sources}
          onToggle={(type) =>
            onChange({
              ...filters,
              sources: toggleValue(filters.sources, type),
            })
          }
        />,
      ),
      onRemove: () => remove("sources", { ...filters, sources: [] }),
    });
  }
  if (filters.creators === null || filters.creators.length > 0) {
    const value =
      filters.creators === null
        ? "Me"
        : summarize(
            filters.creators.map(
              (id) => creators.find((creator) => creator.id === id)?.name ?? id,
            ),
            "creators",
          );
    chips.push({
      key: "creators",
      icon: <UserEdit />,
      property: "Creator",
      operator: binary(
        "creators",
        filters.creators === null || filters.creators.length === 1
          ? "one"
          : "many",
      ),
      value,
      selector: selector(
        "Creator",
        value,
        <OptionSearchList
          placeholder="Find member"
          options={creatorOptions(filters.creators, creators, viewer)}
          onToggle={(key) =>
            onChange({
              ...filters,
              creators:
                key === "__me"
                  ? filters.creators === null
                    ? []
                    : null
                  : filters.creators === null
                    ? [key]
                    : toggleValue(filters.creators, key),
            })
          }
        />,
        "w-56",
      ),
      onRemove: () => remove("creators", { ...filters, creators: [] }),
    });
  }
  if (filters.projects.length > 0) {
    const value = summarize(
      filters.projects.map(
        (id) =>
          projects.find((project) => project.id === id)?.name ??
          "Unknown project",
      ),
      "projects",
    );
    chips.push({
      key: "projects",
      icon: <Box />,
      property: "Project",
      operator: binary(
        "projects",
        filters.projects.length === 1 ? "one" : "many",
      ),
      value,
      selector: selector(
        "Project",
        value,
        <OptionSearchList
          placeholder="Find project"
          options={projects.map((project) => ({
            key: project.id,
            label: project.name,
            checked: filters.projects.includes(project.id),
          }))}
          onToggle={(id) =>
            onChange({
              ...filters,
              projects: toggleValue(filters.projects, id),
            })
          }
        />,
        "w-56",
      ),
      onRemove: () => remove("projects", { ...filters, projects: [] }),
    });
  }
  if (filters.status !== null) {
    const value = statusLabels[filters.status];
    chips.push({
      key: "status",
      icon: <Icon name="toggle" />,
      property: "Status",
      operator: { kind: "fixed", label: "is" },
      value,
      selector: selector(
        "Status",
        value,
        <StatusItems
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
        />,
      ),
      onRemove: () => onChange({ ...filters, status: null }),
    });
  }
  if (filters.created !== null) {
    const value = dateRangeLabel(filters.created);
    chips.push({
      key: "created",
      icon: <Calendar />,
      property: "Created",
      operator: binary("created", "one"),
      value,
      selector: selector(
        "Created",
        value,
        <DateRangeItems
          value={filters.created}
          onChange={(created) => onChange({ ...filters, created })}
          icons={{ calendar: <Calendar />, check: <Checkmark /> }}
        />,
      ),
      onRemove: () => remove("created", { ...filters, created: null }),
    });
  }
  return chips;
};
