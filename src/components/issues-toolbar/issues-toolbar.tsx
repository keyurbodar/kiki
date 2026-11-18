import {
  DisplayChoiceSub,
  DisplayMenu,
  DisplayToggle,
  FilterChipBar,
  MenuSubmenu,
  ViewTab,
  ViewToolbar,
} from "@/components/view-toolbar";
import { MenuSeparator } from "@/primitives/menu";
import {
  emptyIssueFilters,
  filtersForView,
  type IssueFilterSources,
  type IssueFilters,
  IssuesFilterMenu,
  IssuesMatchChip,
  type IssueView,
  issueFilterChips,
  issueViewLabels,
  issueViews,
  matchableCount,
  viewOfFilters,
} from "../issues-filters";
import {
  CheckGlyph,
  CloseGlyph,
  DisplayGlyph,
  EyeOffGlyph,
  FlagGlyph,
  LinkGlyph,
  StatusGlyph,
} from "./glyphs";

export const issueGroupings = [
  "status",
  "assignee",
  "priority",
  "project",
  "label",
  "none",
] as const;
export type IssueGrouping = (typeof issueGroupings)[number];

export const issueGroupingLabels: Record<IssueGrouping, string> = {
  status: "Status",
  assignee: "Assignee",
  priority: "Priority",
  project: "Project",
  label: "Label",
  none: "No grouping",
};

export const issueOrders = [
  "priority",
  "status",
  "updated",
  "created",
  "due",
  "title",
] as const;
export type IssueOrder = (typeof issueOrders)[number];
export type IssueDirection = "asc" | "desc";

export const issueOrderLabels: Record<IssueOrder, string> = {
  priority: "Priority",
  status: "Status",
  updated: "Last updated",
  created: "Created",
  due: "Due date",
  title: "Title",
};

/** The direction each ordering starts in. */
export const issueOrderDirections: Record<IssueOrder, IssueDirection> = {
  priority: "asc",
  status: "asc",
  updated: "desc",
  created: "desc",
  due: "asc",
  title: "asc",
};

export const issueDirectionLabels: Record<IssueDirection, string> = {
  asc: "Ascending",
  desc: "Descending",
};

export type IssueSubIssues = "expanded" | "collapsed";

export const issueSubIssueLabels: Record<IssueSubIssues, string> = {
  expanded: "Expanded",
  collapsed: "Collapsed",
};

export const issueProperties = [
  "id",
  "priority",
  "labels",
  "relations",
  "pulls",
  "due",
  "assignee",
  "updated",
] as const;
export type IssueProperty = (typeof issueProperties)[number];

export const issuePropertyLabels: Record<IssueProperty, string> = {
  id: "ID",
  priority: "Priority",
  labels: "Labels",
  relations: "Relations",
  pulls: "Pull requests",
  due: "Due date",
  assignee: "Assignee",
  updated: "Updated",
};

export type IssueDisplay = {
  readonly grouping: IssueGrouping;
  readonly order: IssueOrder;
  readonly direction: IssueDirection;
  readonly subIssues: IssueSubIssues;
  readonly hidden: ReadonlyArray<IssueProperty>;
};

export const defaultIssueDisplay: IssueDisplay = {
  grouping: "status",
  order: "priority",
  direction: "asc",
  subIssues: "expanded",
  hidden: [],
};

const icons = { check: <CheckGlyph />, remove: <CloseGlyph /> };

/** Capy's IssuesDisplayMenu: grouping, ordering, direction, sub-issues, properties. */
export function IssuesDisplayMenu({
  display,
  onChange,
  properties = issueProperties,
}: {
  display: IssueDisplay;
  onChange: (display: IssueDisplay) => void;
  /** The properties to offer; every one the row can draw by default. */
  properties?: ReadonlyArray<IssueProperty>;
}) {
  const shown = properties.filter(
    (property) => !display.hidden.includes(property),
  );
  return (
    <DisplayMenu icon={<DisplayGlyph />}>
      <DisplayChoiceSub
        icon={<StatusGlyph />}
        label="Grouping"
        labels={issueGroupingLabels}
        value={display.grouping}
        onPick={(grouping) => onChange({ ...display, grouping })}
        icons={icons}
      />
      <DisplayChoiceSub
        icon={<FlagGlyph />}
        label="Ordering"
        labels={issueOrderLabels}
        value={display.order}
        onPick={(order) =>
          onChange({
            ...display,
            order,
            direction: issueOrderDirections[order],
          })
        }
        icons={icons}
      />
      <DisplayChoiceSub
        label="Direction"
        labels={issueDirectionLabels}
        value={display.direction}
        onPick={(direction) => onChange({ ...display, direction })}
        icons={icons}
      />
      <DisplayChoiceSub
        icon={<LinkGlyph />}
        label="Sub-issues"
        labels={issueSubIssueLabels}
        value={display.subIssues}
        onPick={(subIssues) => onChange({ ...display, subIssues })}
        icons={icons}
      />
      <MenuSeparator />
      <MenuSubmenu
        icon={<EyeOffGlyph />}
        label="Properties"
        value={
          shown.length === properties.length ? "All" : `${shown.length} shown`
        }
        contentClassName="w-48"
      >
        {properties.map((property) => (
          <DisplayToggle
            key={property}
            label={issuePropertyLabels[property]}
            checked={!display.hidden.includes(property)}
            onToggle={() =>
              onChange({
                ...display,
                hidden: display.hidden.includes(property)
                  ? display.hidden.filter((hidden) => hidden !== property)
                  : [...display.hidden, property],
              })
            }
            icons={icons}
          />
        ))}
      </MenuSubmenu>
    </DisplayMenu>
  );
}

/** Capy's IssuesToolbar: view tabs, filter and display menus, the chip bar. */
export function IssuesToolbar({
  filters,
  sources,
  display,
  assignedCount,
  mentionCount,
  onFilters,
  onDisplay,
}: {
  filters: IssueFilters;
  sources: IssueFilterSources;
  display: IssueDisplay;
  assignedCount?: number;
  mentionCount?: number;
  onFilters: (filters: IssueFilters) => void;
  onDisplay: (display: IssueDisplay) => void;
}) {
  const view: IssueView | undefined = viewOfFilters(filters);
  const chips = issueFilterChips(filters, sources, onFilters);
  const count = (key: IssueView) => {
    const value =
      key === "assigned"
        ? assignedCount
        : key === "mentioned"
          ? mentionCount
          : undefined;
    return value !== undefined && value > 0 ? (
      <span className="font-normal text-muted-foreground-2 tabular-nums">
        {value}
      </span>
    ) : null;
  };
  return (
    <>
      <ViewToolbar
        tabs={issueViews.map((key) => (
          <ViewTab
            key={key}
            label={issueViewLabels[key]}
            active={view === key}
            onClick={() => onFilters(filtersForView(key))}
          >
            {count(key)}
          </ViewTab>
        ))}
        actions={
          <>
            <IssuesFilterMenu
              filters={filters}
              sources={sources}
              onChange={onFilters}
              onClear={() => onFilters(emptyIssueFilters)}
            />
            <IssuesDisplayMenu display={display} onChange={onDisplay} />
          </>
        }
      />
      {chips.length > 0 ? (
        <FilterChipBar
          chips={chips}
          dirty
          onClear={() => onFilters(emptyIssueFilters)}
          leading={
            matchableCount(filters) > 1 ? (
              <IssuesMatchChip filters={filters} onChange={onFilters} />
            ) : null
          }
          icons={icons}
        />
      ) : null}
    </>
  );
}
