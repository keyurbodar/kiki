import type { ComponentProps, ReactNode } from "react";
import { PullStateIcon } from "@/components/pull-view/pull-parts";
import {
  Glyph,
  type GlyphName,
  type SidebarCaptainSort,
  type SidebarCollapse,
  type SidebarDensity,
  type SidebarGrouping,
  type SidebarShelf,
  type SidebarThreadSort,
} from "@/components/sidebar-threads";
import type { ThreadOrigin } from "@/data/api/schemas/thread";
import {
  defaultThreadFilters,
  prStatusOptions,
  type ThreadFilters,
} from "@/features/threads/threads-page/model";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLabel,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuCheckClassName = "ml-auto size-(--icon-sm) shrink-0 text-foreground";
const menuLabelClassName =
  "mt-1 flex min-h-[calc(var(--spacing)*5.5)] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";
const menuSeparatorClassName = "-mx-1 my-1 h-px bg-border-1";

export const groupingLabels: Record<SidebarGrouping, string> = {
  folders: "Folders",
  projects: "Projects",
};

export const threadSortLabels: Record<SidebarThreadSort, string> = {
  lastActive: "Updated at",
  createdAt: "Created at",
};

export const captainSortLabels: Record<SidebarCaptainSort, string> = {
  drag: "Manual",
  activity: "Updated at",
  createdAt: "Created at",
};

export const densityLabel = (density: SidebarDensity) =>
  density === "compact" ? "Compact" : "Detailed";

export const collapseLabel = ({ working, settled }: SidebarCollapse) =>
  working && settled
    ? "Working, Settled"
    : working
      ? "Working"
      : settled
        ? "Settled"
        : "None";

/** The glyphs the sprite carries, plus the icon-set keys these menus need. */
type MenuGlyphName = GlyphName | "user" | "folder-1" | "circle-dashed";

const iconGlyphs = {
  "folder-1": "folder-1",
  "circle-dashed": "circle-dashed",
  user: "user",
} as const satisfies Record<string, ComponentProps<typeof Icon>["name"]>;

function MenuGlyph({ name }: { name: MenuGlyphName }) {
  return (
    <span className={menuIconClassName}>
      {name in iconGlyphs ? (
        <Icon
          name={iconGlyphs[name as keyof typeof iconGlyphs]}
          className="size-full"
        />
      ) : (
        <Glyph name={name as GlyphName} className="size-full" />
      )}
    </span>
  );
}

function Check({ on }: { on: boolean }) {
  return on ? (
    <Glyph name="checkmark-1" className={menuCheckClassName} />
  ) : null;
}

function SubMenu({
  icon,
  label,
  value,
  contentClassName = "w-44",
  children,
}: {
  icon: MenuGlyphName;
  label: string;
  value?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <ResponsiveMenuSub
      icon={<MenuGlyph name={icon} />}
      label={label}
      value={value}
      contentClassName={contentClassName}
    >
      {children}
    </ResponsiveMenuSub>
  );
}

function OptionsTrigger({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ResponsiveMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={label} />
            }
          >
            <Glyph
              name="dot-grid-1x3-horizontal"
              className="size-(--icon-base)"
            />
          </ResponsiveMenuTrigger>
        }
      />
      <TooltipContent side="bottom">Options</TooltipContent>
    </Tooltip>
  );
}

function GroupingSubMenu({
  grouping,
  onGroupingChange,
}: {
  grouping: SidebarGrouping;
  onGroupingChange: (grouping: SidebarGrouping) => void;
}) {
  return (
    <SubMenu icon="folder-1" label="Group by" value={groupingLabels[grouping]}>
      {(Object.keys(groupingLabels) as SidebarGrouping[]).map((option) => (
        <ResponsiveMenuItem
          key={option}
          onClick={() => onGroupingChange(option)}
        >
          <MenuGlyph name={option === "folders" ? "folder-1" : "box-2"} />
          {groupingLabels[option]}
          <Check on={grouping === option} />
        </ResponsiveMenuItem>
      ))}
    </SubMenu>
  );
}

function DensitySubMenu({
  density,
  onDensityChange,
}: {
  density: SidebarDensity;
  onDensityChange: (density: SidebarDensity) => void;
}) {
  return (
    <SubMenu icon="eye-open" label="Density" value={densityLabel(density)}>
      {(["compact", "detailed"] as const).map((option) => (
        <ResponsiveMenuItem
          key={option}
          onClick={() => onDensityChange(option)}
        >
          <MenuGlyph
            name={option === "compact" ? "list-bullets" : "text-block"}
          />
          {densityLabel(option)}
          <Check on={density === option} />
        </ResponsiveMenuItem>
      ))}
    </SubMenu>
  );
}

export type ThreadOptionsMenuProps = {
  sort: SidebarThreadSort;
  onSortChange: (sort: SidebarThreadSort) => void;
  grouping: SidebarGrouping;
  onGroupingChange: (grouping: SidebarGrouping) => void;
  density: SidebarDensity;
  onDensityChange: (density: SidebarDensity) => void;
  collapse: SidebarCollapse;
  onCollapseChange: (shelf: SidebarShelf, collapsed: boolean) => void;
  filterCount?: number;
  filters?: ReactNode;
  onNewFolder?: () => void;
  onMarkAllRead?: () => void;
  onSearch?: () => void;
  onViewAll?: () => void;
  /** Folders the viewer hid, offered back here so hiding stays reversible. */
  hiddenFolders?: ReadonlyArray<{ id: string; name: string }>;
  onShowFolder?: (folder: { id: string; name: string }) => void;
};

export function ThreadOptionsMenu({
  sort,
  onSortChange,
  grouping,
  onGroupingChange,
  density,
  onDensityChange,
  collapse,
  onCollapseChange,
  filterCount = 0,
  filters,
  onNewFolder,
  onMarkAllRead,
  onSearch,
  onViewAll,
  hiddenFolders,
  onShowFolder,
}: ThreadOptionsMenuProps) {
  return (
    <ResponsiveMenu>
      <OptionsTrigger label="Thread options" />
      <ResponsiveMenuContent align="end" className="w-60">
        {onNewFolder === undefined ? null : (
          <ResponsiveMenuItem onClick={onNewFolder}>
            <MenuGlyph name="folder-add-left" />
            New folder
          </ResponsiveMenuItem>
        )}
        {onMarkAllRead === undefined ? null : (
          <ResponsiveMenuItem onClick={onMarkAllRead}>
            <MenuGlyph name="email-2-check" />
            Mark all as read
          </ResponsiveMenuItem>
        )}
        {onNewFolder === undefined && onMarkAllRead === undefined ? null : (
          <ResponsiveMenuSeparator className={menuSeparatorClassName} />
        )}
        <ResponsiveMenuLabel className={menuLabelClassName}>
          View
        </ResponsiveMenuLabel>
        <GroupingSubMenu
          grouping={grouping}
          onGroupingChange={onGroupingChange}
        />
        <SubMenu
          icon="sort-arrow-up-down"
          label="Sort by"
          value={threadSortLabels[sort]}
        >
          {(Object.keys(threadSortLabels) as SidebarThreadSort[]).map(
            (option) => (
              <ResponsiveMenuItem
                key={option}
                onClick={() => onSortChange(option)}
              >
                <MenuGlyph
                  name={
                    option === "lastActive"
                      ? "arrow-rotate-clockwise"
                      : "calendar-clock-4"
                  }
                />
                {threadSortLabels[option]}
                <Check on={sort === option} />
              </ResponsiveMenuItem>
            ),
          )}
        </SubMenu>
        <DensitySubMenu density={density} onDensityChange={onDensityChange} />
        {hiddenFolders === undefined || hiddenFolders.length === 0 ? null : (
          <SubMenu
            icon="eye-open"
            label="Hidden folders"
            value={hiddenFolders.length}
          >
            {hiddenFolders.map((folder) => (
              <ResponsiveMenuItem
                key={folder.id}
                onClick={() => onShowFolder?.(folder)}
              >
                <MenuGlyph name="folder-1" />
                {folder.name}
              </ResponsiveMenuItem>
            ))}
          </SubMenu>
        )}
        <SubMenu
          icon="layers-three"
          label="Collapse"
          value={collapseLabel(collapse)}
        >
          {(["working", "settled"] as const).map((shelf) => (
            <ResponsiveMenuItem
              key={shelf}
              closeOnClick={false}
              onClick={() => onCollapseChange(shelf, !collapse[shelf])}
            >
              {shelf === "working" ? "Working" : "Settled"}
              <Check on={collapse[shelf]} />
            </ResponsiveMenuItem>
          ))}
        </SubMenu>
        {onSearch === undefined && filters === undefined ? null : (
          <>
            <ResponsiveMenuSeparator className={menuSeparatorClassName} />
            <ResponsiveMenuLabel className={menuLabelClassName}>
              Filter
            </ResponsiveMenuLabel>
            {onSearch === undefined ? null : (
              <ResponsiveMenuItem onClick={onSearch}>
                <MenuGlyph name="magnifying-glass" />
                Search threads
              </ResponsiveMenuItem>
            )}
            {filters === undefined ? null : (
              <SubMenu
                icon="filter-1"
                label="Filters"
                value={filterCount > 0 ? filterCount : undefined}
                contentClassName="kiki-menu-filter"
              >
                {filters}
              </SubMenu>
            )}
          </>
        )}
        {onViewAll === undefined ? null : (
          <>
            <ResponsiveMenuSeparator className={menuSeparatorClassName} />
            <ResponsiveMenuItem onClick={onViewAll}>
              <MenuGlyph name="list-bullets" />
              View all threads
            </ResponsiveMenuItem>
          </>
        )}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

export type CaptainOptionsMenuProps = {
  order: SidebarCaptainSort;
  onOrderChange: (order: SidebarCaptainSort) => void;
  density: SidebarDensity;
  onDensityChange: (density: SidebarDensity) => void;
};

export function CaptainOptionsMenu({
  order,
  onOrderChange,
  density,
  onDensityChange,
}: CaptainOptionsMenuProps) {
  // Capy's Captain menu also carries New folder. That row is absent here because
  // a captains-section folder still has no readable contents: the folder board
  // endpoint returns thread cards only, so the folder would draw empty.
  return (
    <ResponsiveMenu>
      <OptionsTrigger label="Captain options" />
      <ResponsiveMenuContent align="end" className="w-60">
        <SubMenu
          icon="sort-arrow-up-down"
          label="Sort by"
          value={captainSortLabels[order]}
        >
          {(Object.keys(captainSortLabels) as SidebarCaptainSort[]).map(
            (option) => (
              <ResponsiveMenuItem
                key={option}
                onClick={() => onOrderChange(option)}
              >
                <MenuGlyph
                  name={
                    option === "drag"
                      ? "reorder"
                      : option === "activity"
                        ? "arrow-rotate-clockwise"
                        : "calendar-clock-4"
                  }
                />
                {captainSortLabels[option]}
                <Check on={order === option} />
              </ResponsiveMenuItem>
            ),
          )}
        </SubMenu>
        <DensitySubMenu density={density} onDensityChange={onDensityChange} />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

type ThreadFilterFacetsProps = {
  filters: ThreadFilters;
  onChange: (filters: ThreadFilters) => void;
  origins: ReadonlyArray<ThreadOrigin>;
  projects: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  members: ReadonlyArray<{ readonly id: string; readonly label: string }>;
};

const originLabels: Record<ThreadOrigin, string> = {
  web: "Web",
  slack: "Slack",
  linear: "Linear",
  github: "GitHub",
  api: "API",
  capy: "Capy",
  automation: "Automation",
};

const toggle = (values: ReadonlyArray<string>, value: string) =>
  values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];

/** A submenu row's trailing value: how many facets inside it are picked. */
const countLabel = (count: number) => (count === 0 ? undefined : String(count));

const emptyThreadFilters = (filters: ThreadFilters) =>
  filters.projects.length === 0 &&
  filters.authors.length === 0 &&
  filters.prStates.length === 0 &&
  filters.origins.length === 0;

/**
 * Capy's sidebar filter facets. They write the threads page's own `ThreadFilters`,
 * so the two surfaces cannot disagree about what "Created by" or "PR status"
 * means. Participants is absent: the sidebar's card carries no participant list,
 * so the facet could only ever empty the list.
 */
export function ThreadFilterFacets({
  filters,
  onChange,
  origins,
  projects,
  members,
}: ThreadFilterFacetsProps) {
  return (
    <>
      {projects.length === 0 ? null : (
        <SubMenu
          icon="folder-1"
          label="Project"
          value={countLabel(filters.projects.length)}
          contentClassName="kiki-menu-filter"
        >
          {projects.map((project) => (
            <ResponsiveMenuItem
              key={project.id}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  projects: toggle(filters.projects, project.id),
                })
              }
            >
              <MenuGlyph name="box-2" />
              {project.name}
              <Check on={filters.projects.includes(project.id)} />
            </ResponsiveMenuItem>
          ))}
        </SubMenu>
      )}
      {members.length === 0 ? null : (
        <SubMenu
          icon="user"
          label="Created by"
          value={countLabel(filters.authors.length)}
          contentClassName="kiki-menu-filter"
        >
          {members.map((member) => (
            <ResponsiveMenuItem
              key={member.id}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  authors: toggle(filters.authors, member.id),
                })
              }
            >
              <span className={menuIconClassName}>
                <Icon name="user" className="size-full" />
              </span>
              {member.label}
              <Check on={filters.authors.includes(member.id)} />
            </ResponsiveMenuItem>
          ))}
        </SubMenu>
      )}
      <SubMenu
        icon="filter-1"
        label="PR status"
        value={countLabel(filters.prStates.length)}
        contentClassName="w-56"
      >
        {prStatusOptions.map((option) => (
          <ResponsiveMenuItem
            key={option.id}
            closeOnClick={false}
            onClick={() =>
              onChange({
                ...filters,
                prStates: toggle(filters.prStates, option.id),
              })
            }
          >
            <span className={menuIconClassName}>
              {option.id === "none" ? null : (
                <PullStateIcon state={option.id} />
              )}
            </span>
            {option.label}
            <Check on={filters.prStates.includes(option.id)} />
          </ResponsiveMenuItem>
        ))}
      </SubMenu>
      {origins.length === 0 ? null : (
        <SubMenu
          icon="circle-dashed"
          label="Origin"
          value={countLabel(filters.origins.length)}
          contentClassName="kiki-menu-filter"
        >
          {origins.map((origin) => (
            <ResponsiveMenuItem
              key={origin}
              closeOnClick={false}
              onClick={() =>
                onChange({
                  ...filters,
                  origins: toggle(filters.origins, origin),
                })
              }
            >
              <span className={menuIconClassName}>
                <Icon
                  name={origin === "slack" ? "bubble-dots" : "circle-dashed"}
                  className="size-full"
                />
              </span>
              {originLabels[origin]}
              <Check on={filters.origins.includes(origin)} />
            </ResponsiveMenuItem>
          ))}
        </SubMenu>
      )}
      <ResponsiveMenuItem
        disabled={emptyThreadFilters(filters)}
        onClick={() => onChange(defaultThreadFilters)}
      >
        <span className={menuIconClassName}>
          <Icon name="arrow-rotate-clockwise" className="size-full" />
        </span>
        Reset to default
      </ResponsiveMenuItem>
    </>
  );
}

/** How many facets are narrowing the list, for the trigger's badge. */
export const activeFacetCount = (filters: ThreadFilters) =>
  filters.projects.length +
  filters.authors.length +
  filters.prStates.length +
  filters.origins.length;
