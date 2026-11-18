import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { ChevronDownGlyph, DotsHorizontalGlyph } from "./glyphs.tsx";
import { describeHealth } from "./routing.ts";
import type { Health } from "./types.ts";
import { usageColumns } from "./usage.ts";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const wideColumns =
  "hidden items-center @min-connections-wide/connections:flex";
export const narrowOnly = "@max-connections-wide/connections:hidden";
export const usageColumnClass = "w-20 text-right";

export type ConnectionListProps = {
  ids: ReadonlyArray<string>;
  editable: boolean;
  onReorder: (ids: Array<string>) => void;
  children: ReactNode;
};

export function ConnectionList({
  ids,
  editable,
  onReorder,
  children,
}: ConnectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!editable || over === null || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove([...ids], from, to));
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        <div
          data-slot="sortable-list"
          className="@container/connections divide-y-(length:--border-width-hairline) divide-border-1"
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export type ConnectionPower = {
  checked: boolean;
  disabled?: boolean;
  title?: string;
  onChange: (checked: boolean) => void;
};

export type ConnectionShellProps = {
  id?: string;
  sortId?: string;
  draggable?: boolean;
  dragReason?: string;
  icon: ReactNode;
  label: string;
  display?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  power?: ConnectionPower;
  menuLabel?: string;
  menu?: ReactNode;
  menuDisabled?: boolean;
  menuTitle?: string;
  expanded: boolean;
  onToggle?: () => void;
  children?: ReactNode;
};

export function ConnectionShell({
  id,
  sortId,
  draggable = false,
  dragReason,
  icon,
  label,
  display,
  description,
  badge,
  power,
  menuLabel,
  menu,
  menuDisabled,
  menuTitle,
  expanded,
  onToggle,
  children,
}: ConnectionShellProps) {
  const sortable = useSortable({
    id: sortId ?? "capy",
    disabled: sortId === undefined || !draggable,
  });
  const sortableProps =
    sortId === undefined
      ? {}
      : {
          ref: sortable.setNodeRef,
          style: {
            transform:
              sortable.transform === null
                ? undefined
                : `translate3d(0, ${sortable.transform.y}px, 0)`,
            transition: sortable.transition,
          },
        };
  const actions = (
    <>
      {menu === undefined ? null : (
        <ResponsiveMenu>
          <ResponsiveMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={menuDisabled}
                title={menuTitle}
                aria-label={menuLabel}
              />
            }
          >
            <DotsHorizontalGlyph />
          </ResponsiveMenuTrigger>
          <ResponsiveMenuContent align="end" className="w-48">
            {menu}
          </ResponsiveMenuContent>
        </ResponsiveMenu>
      )}
      {onToggle === undefined ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={onToggle}
        >
          <ChevronDownGlyph
            className={cx(
              "transition-transform duration-fast",
              expanded && "rotate-180",
            )}
          />
        </Button>
      )}
    </>
  );
  return (
    <div
      id={id}
      {...sortableProps}
      className={cx("flex flex-col", sortable.isDragging && "relative z-10")}
    >
      <div className="group/row relative">
        <SettingsRow
          icon={icon}
          label={display ?? label}
          description={description}
          actions={actions}
        >
          {badge}
          {power === undefined ? null : (
            <Switch
              checked={power.checked}
              disabled={power.disabled}
              title={power.title}
              aria-label={`${power.checked ? "Turn off" : "Turn on"} ${label}`}
              onCheckedChange={power.onChange}
            />
          )}
        </SettingsRow>
        {sortId === undefined ? null : (
          <button
            type="button"
            aria-label={`Reorder ${label}`}
            disabled={!draggable}
            title={draggable ? undefined : dragReason}
            className="absolute top-1/2 left-2 flex h-6 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center text-muted-foreground-3 opacity-0 outline-none group-hover/row:opacity-100 focus-visible:opacity-100 disabled:cursor-default"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <DotsHorizontalGlyph className="size-(--icon-xs) rotate-90" />
          </button>
        )}
      </div>
      {expanded ? (
        <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
      ) : null}
    </div>
  );
}

export function HealthBadge({ health }: { health: Health | undefined }) {
  if (health === undefined) return null;
  const summary = describeHealth(health, Date.now());
  return (
    <span className="flex items-center gap-1.5">
      {summary.badge === undefined || health.state === "disabled" ? null : (
        <Badge color="warning" title={summary.sentence}>
          {summary.badge}
        </Badge>
      )}
    </span>
  );
}

export function ConnectionsHeader({ fable }: { fable: boolean }) {
  return (
    <div className="@container/connections">
      <div className="hidden items-center justify-between gap-6 border-b-(length:--border-width-hairline) border-border-1 px-4 py-2 text-2xs font-normal text-muted-foreground-3 @min-connections-wide/connections:flex">
        <span className="pl-11">Account</span>
        <span className="flex items-center gap-2">
          <span className="flex">
            {usageColumns.map((column) => (
              <span key={column.label} className={usageColumnClass}>
                {`${column.label} used`}
              </span>
            ))}
            {fable ? (
              <span className={usageColumnClass}>Fable used</span>
            ) : null}
            <span className="w-12">Resets</span>
          </span>
          <span aria-hidden className="invisible flex items-center gap-2">
            <Switch checked={false} tabIndex={-1} />
            <span className="-mr-2 flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" tabIndex={-1}>
                <DotsHorizontalGlyph />
              </Button>
              <Button variant="ghost" size="icon-sm" tabIndex={-1}>
                <ChevronDownGlyph />
              </Button>
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
