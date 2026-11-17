import type { ReactNode } from "react";
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
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuValueClassName =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
const menuChevronClassName =
  "size-(--icon-sm) shrink-0 text-muted-foreground-3";
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

type MenuGlyphName = GlyphName | "folder-1";

function MenuGlyph({ name }: { name: MenuGlyphName }) {
  return (
    <span className={menuIconClassName}>
      {name === "folder-1" ? (
        <Icon name={name} className="size-full" />
      ) : (
        <Glyph name={name} className="size-full" />
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
    <MenuSub>
      <MenuSubTrigger>
        <MenuGlyph name={icon} />
        <span className="min-w-0 truncate">{label}</span>
        <span className={menuValueClassName}>
          {value === undefined ? null : (
            <span className="min-w-0 max-w-32 truncate">{value}</span>
          )}
          <Icon name="chevron-right" className={menuChevronClassName} />
        </span>
      </MenuSubTrigger>
      <MenuContent className={contentClassName}>{children}</MenuContent>
    </MenuSub>
  );
}

function OptionsTrigger({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <MenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={label} />
            }
          >
            <Glyph
              name="dot-grid-1x3-horizontal"
              className="size-(--icon-base)"
            />
          </MenuTrigger>
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
}: ThreadOptionsMenuProps) {
  return (
    <ResponsiveMenu>
      <OptionsTrigger label="Thread options" />
      <MenuContent align="end" className="w-60">
        <ResponsiveMenuItem onClick={onNewFolder}>
          <MenuGlyph name="folder-add-left" />
          New folder
        </ResponsiveMenuItem>
        {onMarkAllRead === undefined ? null : (
          <ResponsiveMenuItem onClick={onMarkAllRead}>
            <MenuGlyph name="email-2-check" />
            Mark all as read
          </ResponsiveMenuItem>
        )}
        <MenuSeparator className={menuSeparatorClassName} />
        <MenuLabel className={menuLabelClassName}>View</MenuLabel>
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
        <MenuSeparator className={menuSeparatorClassName} />
        <MenuLabel className={menuLabelClassName}>Filter</MenuLabel>
        <ResponsiveMenuItem onClick={onSearch}>
          <MenuGlyph name="magnifying-glass" />
          Search threads
        </ResponsiveMenuItem>
        <SubMenu
          icon="filter-1"
          label="Filters"
          value={filterCount > 0 ? filterCount : undefined}
          contentClassName="w-56"
        >
          {filters}
        </SubMenu>
        {onViewAll === undefined ? null : (
          <>
            <MenuSeparator className={menuSeparatorClassName} />
            <ResponsiveMenuItem onClick={onViewAll}>
              <MenuGlyph name="list-bullets" />
              View all threads
            </ResponsiveMenuItem>
          </>
        )}
      </MenuContent>
    </ResponsiveMenu>
  );
}

export type CaptainOptionsMenuProps = {
  grouping: SidebarGrouping;
  onGroupingChange: (grouping: SidebarGrouping) => void;
  order: SidebarCaptainSort;
  onOrderChange: (order: SidebarCaptainSort) => void;
  density: SidebarDensity;
  onDensityChange: (density: SidebarDensity) => void;
  onNewFolder?: () => void;
};

export function CaptainOptionsMenu({
  grouping,
  onGroupingChange,
  order,
  onOrderChange,
  density,
  onDensityChange,
  onNewFolder,
}: CaptainOptionsMenuProps) {
  return (
    <ResponsiveMenu>
      <OptionsTrigger label="Captain options" />
      <MenuContent align="end" className="w-60">
        {onNewFolder === undefined ? null : (
          <>
            <ResponsiveMenuItem onClick={onNewFolder}>
              <MenuGlyph name="folder-add-left" />
              New folder
            </ResponsiveMenuItem>
            <MenuSeparator className={menuSeparatorClassName} />
          </>
        )}
        <GroupingSubMenu
          grouping={grouping}
          onGroupingChange={onGroupingChange}
        />
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
      </MenuContent>
    </ResponsiveMenu>
  );
}
