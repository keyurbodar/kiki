import { Link, useNavigate } from "@tanstack/react-router";
import { type MouseEvent, memo, type ReactNode, useRef, useState } from "react";
import { cx, menuIconSlotClassName } from "@/components/view-toolbar";
import { Badge } from "@/primitives/badge";
import { BulkBar } from "@/primitives/bulk-bar";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { MenuItem, MenuSeparator } from "@/primitives/menu";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type AutomationRow, formatRelativeTime } from "./automation";
import {
  useRunAutomation,
  useSetAutomationsEnabled,
} from "./automations-query";
import {
  Checkmark,
  ChevronDownSmall,
  Expand,
  ListBullets,
  TrashCan,
} from "./glyphs";
import {
  describeTriggers,
  TriggerIcon,
  type TriggerType,
  triggerStatus,
  triggerTypeLabels,
} from "./triggers";

const track = (owner: string) =>
  `features/automations/automations-list.tsx#${owner}`;

const slotClassName = "w-4 shrink-0";
const rowItemClassName =
  "-m-0.5 p-0.5 [content-visibility:auto] [contain-intrinsic-size:auto_46px]";
const skeletonWidths = ["w-2/5", "w-1/4", "w-1/3", "w-1/5"];
const checkboxBoxClassName =
  "flex size-3.5 items-center justify-center rounded border-hairline border-border-2 bg-card data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:text-primary-foreground";
const menuTrailingClassName = "ml-auto pl-3 text-xs text-muted-foreground-2";

export type AutomationListSection = {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<AutomationRow>;
};

export type AutomationsListProps = {
  sections: ReadonlyArray<AutomationListSection>;
  now: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  checked: ReadonlySet<string>;
  onCheckedChange: (checked: ReadonlySet<string>) => void;
  onDelete: (rows: ReadonlyArray<AutomationRow>) => void;
  loading?: boolean;
  emptyText: string;
  orgId: string | undefined;
};

/** Initials avatar at Capy's xs size; creators carry no image in the list. */
export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      data-slot="avatar"
      className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xs font-medium text-muted-foreground-1"
    >
      {initials}
    </span>
  );
}

function RowCheckbox({
  checked,
  visible,
  onCheck,
}: {
  checked: boolean;
  visible: boolean;
  onCheck: (shift: boolean) => void;
}) {
  return (
    <button
      data-track-owner={track("RowCheckbox:button.1")}
      type="button"
      aria-label={checked ? "Deselect automation" : "Select automation"}
      aria-pressed={checked}
      className={cx(
        slotClassName,
        "flex cursor-pointer items-center justify-center outline-none",
        "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100",
        "pointer-coarse:hidden",
        (checked || visible) && "opacity-100 pointer-coarse:flex",
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onCheck(event.shiftKey);
      }}
    >
      <span
        className={checkboxBoxClassName}
        data-checked={checked ? "" : undefined}
      >
        {checked ? <Checkmark className="size-3" /> : null}
      </span>
    </button>
  );
}

function StandingThreadBadge({ jamId }: { jamId: string }) {
  const navigate = useNavigate();
  const title = "Thread";
  return (
    <Badge
      data-track-owner={track("StandingThreadBadge:Badge.1")}
      size="base"
      className="max-w-48"
      aria-label={`Runs in ${title}, open thread`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void navigate({ to: "/thread/$threadId", params: { threadId: jamId } });
      }}
    >
      <span className="min-w-0 truncate">{title}</span>
    </Badge>
  );
}

export type AutomationMenuItemsProps = {
  automation: AutomationRow;
  orgId: string | undefined;
  onDelete?: () => void;
};

/** Run now, View runs, Edit, Enable or Disable, and Delete. */
export function AutomationMenuItems({
  automation,
  orgId,
  onDelete,
}: AutomationMenuItemsProps) {
  const navigate = useNavigate();
  const run = useRunAutomation(orgId);
  const setEnabled = useSetAutomationsEnabled(orgId);
  const unshipped = automation.triggers.filter(
    (trigger) => triggerStatus(trigger) !== "shipped",
  );
  const toggle = (enabled: boolean) =>
    setEnabled(
      [automation],
      enabled,
      enabled ? "Automation enabled" : "Automation disabled",
      automation.name,
    );
  return (
    <>
      <MenuItem
        data-track-owner={track(
          "AutomationMenuItems:ResponsiveMenuItem[Run now]",
        )}
        onClick={() => run(automation)}
      >
        <span className={menuIconSlotClassName}>
          <Icon name="play" />
        </span>
        Run now
      </MenuItem>
      {automation.singleJamId === null ? (
        <MenuItem
          data-track-owner={track(
            "AutomationMenuItems:ResponsiveMenuItem[View runs]",
          )}
          onClick={() =>
            void navigate({
              to: "/threads",
              search: { automation: automation.id },
            })
          }
        >
          <span className={menuIconSlotClassName}>
            <ListBullets />
          </span>
          View runs
        </MenuItem>
      ) : (
        <MenuItem
          data-track-owner={track(
            "OpenThreadItem:ResponsiveMenuItem[Open thread]",
          )}
          onClick={() =>
            void navigate({
              to: "/thread/$threadId",
              params: { threadId: automation.singleJamId ?? "" },
            })
          }
        >
          <span className={menuIconSlotClassName}>
            <Expand />
          </span>
          Open thread
        </MenuItem>
      )}
      <MenuItem
        data-track-owner={track("AutomationMenuItems:ResponsiveMenuItem[Edit]")}
        onClick={() =>
          void navigate({
            to: "/automation/$automationId",
            params: { automationId: automation.id },
          })
        }
      >
        <span className={menuIconSlotClassName}>
          <Icon name="pencil" />
        </span>
        Edit
      </MenuItem>
      <MenuSeparator />
      {automation.enabled ? (
        <MenuItem
          data-track-owner={track(
            "AutomationMenuItems:ResponsiveMenuItem[Disable]",
          )}
          onClick={() => toggle(false)}
        >
          <span className={menuIconSlotClassName}>
            <Icon name="circle-dotted" />
          </span>
          Disable
        </MenuItem>
      ) : (
        <MenuItem
          data-track-owner={track(
            "AutomationMenuItems:ResponsiveMenuItem[Enable]",
          )}
          disabled={unshipped.length > 0}
          onClick={() => toggle(true)}
        >
          <span className={menuIconSlotClassName}>
            <Checkmark />
          </span>
          Enable
          {unshipped.length === 0 ? null : (
            <span className={menuTrailingClassName}>Coming soon</span>
          )}
        </MenuItem>
      )}
      {onDelete === undefined ? null : (
        <>
          <MenuSeparator />
          <MenuItem
            data-track-owner={track(
              "AutomationMenuItems:ResponsiveMenuItem[Delete]",
            )}
            intent="danger"
            onClick={onDelete}
          >
            <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
              <TrashCan />
            </span>
            Delete
          </MenuItem>
        </>
      )}
    </>
  );
}

type AutomationRowItemProps = {
  automation: AutomationRow;
  now: number;
  selected: boolean;
  checked: boolean;
  selectionMode: boolean;
  orgId: string | undefined;
  onCheck: (id: string, shift: boolean) => void;
  onDelete: (rows: ReadonlyArray<AutomationRow>) => void;
};

const AutomationRowItem = memo(function AutomationRowItem({
  automation,
  now,
  selected,
  checked,
  selectionMode,
  orgId,
  onCheck,
  onDelete,
}: AutomationRowItemProps) {
  const sources = [
    ...new Set(automation.triggers.map((trigger) => trigger.type)),
  ] as TriggerType[];
  const extraSources = sources.slice(1);
  const first = automation.triggers[0];
  const summary = describeTriggers(automation.triggers);
  const lastRun =
    automation.lastTriggeredAt === null
      ? ""
      : formatRelativeTime(automation.lastTriggeredAt, { now, minified: true });
  const onClick = (event: MouseEvent) => {
    if (event.shiftKey && selectionMode) {
      event.preventDefault();
      onCheck(automation.id, true);
    }
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-track-owner={track("module:ContextMenuTrigger.1")}
        className="group/row relative block"
      >
        <Link
          data-track-owner={track("module:Link[onClick=onClick]")}
          to="/automation/$automationId"
          params={{ automationId: automation.id }}
          data-automation-row={automation.id}
          data-selected={selected ? "" : undefined}
          className={cx(
            "flex h-11 items-center gap-2 rounded px-2 outline-none select-none [-webkit-touch-callout:none]",
            "transition-colors duration-100 hover:bg-secondary data-[selected]:bg-secondary",
            "focus-visible:outline-ring-inset",
          )}
          onClick={onClick}
        >
          <RowCheckbox
            checked={checked}
            visible={selectionMode}
            onCheck={(shift) => onCheck(automation.id, shift)}
          />
          <span
            className={cx(
              slotClassName,
              "flex items-center justify-center",
              !automation.enabled && "opacity-50",
            )}
          >
            {first === undefined ? null : <TriggerIcon type={first.type} />}
          </span>
          <InitialsAvatar name={automation.creator} />
          <span className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
            {automation.name}
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 @lg/list:flex">
            {automation.singleJamId === null ? null : (
              <StandingThreadBadge jamId={automation.singleJamId} />
            )}
            {extraSources.map((type) => (
              <Badge key={type} size="base" className="@max-xl/list:hidden">
                <TriggerIcon type={type} className="size-(--icon-xs)" />
                {triggerTypeLabels[type]}
              </Badge>
            ))}
            {summary === undefined ? null : (
              <span className="@max-lg/list:hidden shrink-0 text-xs font-normal text-muted-foreground-2">
                {summary}
              </span>
            )}
          </span>
          <span
            className="w-10 shrink-0 text-right text-xs font-normal text-muted-foreground-2 tabular-nums"
            suppressHydrationWarning
          >
            {lastRun}
          </span>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <AutomationMenuItems
          automation={automation}
          orgId={orgId}
          onDelete={() => onDelete([automation])}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

/** Shift-click extends the check from the last anchor across visible rows. */
export const toggleChecked = (
  checked: ReadonlySet<string>,
  visible: ReadonlyArray<string>,
  anchor: string | null,
  id: string,
  shift: boolean,
): ReadonlySet<string> => {
  const next = new Set(checked);
  const from = anchor === null ? -1 : visible.indexOf(anchor);
  const to = visible.indexOf(id);
  if (shift && from !== -1 && to !== -1) {
    const [start, end] = from < to ? [from, to] : [to, from];
    for (const key of visible.slice(start, end + 1)) next.add(key);
    return next;
  }
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

function LoadingRows() {
  return (
    <SkeletonPanel
      aria-label="Loading automations"
      className="flex flex-col pt-1"
    >
      {skeletonWidths.map((width) => (
        <div key={width} className="flex h-11 items-center gap-2 rounded px-2">
          <span
            className={cx(slotClassName, "flex items-center justify-center")}
          >
            <span className="size-3.5 rounded bg-secondary" />
          </span>
          <span className="size-4 shrink-0 rounded-full bg-secondary" />
          <span className={cx("h-3 rounded bg-secondary", width)} />
          <span className="ml-auto h-3 w-10 shrink-0 rounded bg-secondary" />
        </div>
      ))}
    </SkeletonPanel>
  );
}

/** Collapsible Active and Disabled sections of automation rows. */
export function AutomationsList({
  sections,
  now,
  selectedId,
  checked,
  onCheckedChange,
  onDelete,
  loading = false,
  emptyText,
  orgId,
}: AutomationsListProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const isOpen = (id: string) => !collapsed.has(id);
  const setOpen = (id: string, open: boolean) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (open) next.delete(id);
      else next.add(id);
      return next;
    });
  const visible = sections
    .filter((section) => isOpen(section.id))
    .flatMap((section) => section.members.map((row) => row.id));
  const onCheck = (id: string, shift: boolean) => {
    onCheckedChange(toggleChecked(checked, visible, anchor.current, id, shift));
    anchor.current = id;
  };
  if (sections.length === 0) {
    if (loading) return <LoadingRows />;
    return (
      <div className="flex items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="flex flex-col pt-1">
      {sections.map((section, index) => (
        <div key={section.id} className={cx(index > 0 && "mt-1")}>
          <Collapsible
            open={isOpen(section.id)}
            onOpenChange={(open) => setOpen(section.id, open)}
          >
            <ContextMenu>
              <ContextMenuTrigger
                data-track-owner={track("AutomationsList:ContextMenuTrigger.1")}
                className="block"
              >
                <CollapsibleTrigger
                  data-track-owner={track(
                    "AutomationsList:CollapsibleTrigger.1",
                  )}
                  block
                  showChevron={false}
                  tone="section"
                >
                  <span className="flex w-4 shrink-0 items-center justify-center">
                    <ChevronDownSmall className="size-(--icon-xs) shrink-0 -rotate-90 text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/collapsible:rotate-0" />
                  </span>
                  {section.label}
                  <span className="font-normal text-muted-foreground-2 tabular-nums">
                    {section.members.length}
                  </span>
                </CollapsibleTrigger>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <MenuItem
                  data-track-owner={track(
                    "AutomationsList:ResponsiveMenuItem.1",
                  )}
                  onClick={() => setOpen(section.id, !isOpen(section.id))}
                >
                  <span className={menuIconSlotClassName}>
                    <ChevronDownSmall />
                  </span>
                  {isOpen(section.id) ? "Collapse" : "Expand"}
                </MenuItem>
                {section.members.length > 0 ? (
                  <MenuItem
                    data-track-owner={track(
                      "AutomationsList:ResponsiveMenuItem[Select all]",
                    )}
                    onClick={() =>
                      onCheckedChange(
                        new Set([
                          ...checked,
                          ...section.members.map((row) => row.id),
                        ]),
                      )
                    }
                  >
                    <span className={menuIconSlotClassName}>
                      <Checkmark />
                    </span>
                    Select all
                  </MenuItem>
                ) : null}
              </ContextMenuContent>
            </ContextMenu>
            <CollapsiblePanel className="-m-0.5 p-0.5">
              <ul className="flex flex-col pt-1">
                {section.members.map((row) => (
                  <li key={row.id} className={rowItemClassName}>
                    <AutomationRowItem
                      automation={row}
                      now={now}
                      selected={selectedId === row.id}
                      checked={checked.has(row.id)}
                      selectionMode={checked.size > 0}
                      orgId={orgId}
                      onCheck={onCheck}
                      onDelete={onDelete}
                    />
                  </li>
                ))}
              </ul>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

export type AutomationsBulkBarProps = {
  checked: ReadonlySet<string>;
  automations: ReadonlyArray<AutomationRow>;
  orgId: string | undefined;
  onDelete: (rows: ReadonlyArray<AutomationRow>) => void;
  onClear: () => void;
};

function BulkAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip disabled={disabled}>
      <TooltipTrigger
        render={
          <Button
            data-track-owner={track(`AutomationsBulkBar:Button[${label}]`)}
            variant="ghost"
            size="sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {children}
        <span className="@max-md/bulk:sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Enable, disable or delete the checked automations. */
export function AutomationsBulkBar({
  checked,
  automations,
  orgId,
  onDelete,
  onClear,
}: AutomationsBulkBarProps) {
  const setEnabled = useSetAutomationsEnabled(orgId);
  const selected = automations.filter((row) => checked.has(row.id));
  const toEnable = selected.filter(
    (row) =>
      !row.enabled &&
      row.triggers.every((trigger) => triggerStatus(trigger) === "shipped"),
  );
  const toDisable = selected.filter((row) => row.enabled);
  const apply = (
    rows: ReadonlyArray<AutomationRow>,
    enabled: boolean,
    message: string,
  ) => {
    if (rows.length === 0) return;
    setEnabled(rows, enabled, message, `${rows.length} selected`);
    onClear();
  };
  return (
    <BulkBar data-count={checked.size}>
      <span className="text-sm font-medium tabular-nums">
        {checked.size} selected
      </span>
      <BulkAction
        label="Enable"
        disabled={toEnable.length === 0}
        onClick={() => apply(toEnable, true, "Automations enabled")}
      >
        <Checkmark />
      </BulkAction>
      <BulkAction
        label="Disable"
        disabled={toDisable.length === 0}
        onClick={() => apply(toDisable, false, "Automations disabled")}
      >
        <Icon name="circle-dotted" />
      </BulkAction>
      <BulkAction
        label="Delete"
        disabled={selected.length === 0}
        onClick={() => onDelete(selected)}
      >
        <TrashCan />
      </BulkAction>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Clear selection"
        onClick={onClear}
      >
        <Icon name="x" />
      </Button>
    </BulkBar>
  );
}
