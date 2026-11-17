import { type ComponentProps, useState } from "react";
import {
  joinClasses,
  SelectorCheck,
  SelectorChevron,
  SelectorItemIcon,
  SelectorRow,
  SelectorSkeleton,
  SelectorSubmenu,
  StatusDot,
  selectorIconSlot,
  selectorItemLabel,
  selectorTriggerIcon,
} from "@/components/project-select/selector-parts";
import { Button } from "@/primitives/button";
import { Icon, type IconProps } from "@/primitives/icon";
import {
  MenuContent,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import {
  type DeviceHardware,
  deviceDescription,
  folderName,
  type RunOnEntry,
  type RunOnPlacement,
  relativeTime,
} from "./entries";
import {
  ExistingWorktreeRows,
  type ExistingWorktreeRowsProps,
  WorktreeScanning,
} from "./existing-worktree-rows";

const hardwareIcons: Record<string, IconProps["name"]> = {
  laptop: "macbook",
  desktop: "studio-display",
  server: "server",
  cloud: "cloud",
};

export function HardwareIcon({
  hardware,
  className,
}: {
  hardware: DeviceHardware | null;
  className?: string;
}) {
  return (
    <Icon
      name={hardwareIcons[hardware?.formFactor ?? ""] ?? "devices"}
      size="sm"
      className={className}
    />
  );
}

export type RunOnExistingWorktrees = Omit<
  ExistingWorktreeRowsProps,
  "selectedRoot" | "linkedRoots" | "scanning" | "onPick"
>;

export type RunOnSelectProps = Omit<ComponentProps<"div">, "onChange"> & {
  devices?: readonly RunOnEntry[];
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  value?: RunOnEntry | null;
  unresolved?: boolean;
  onChange?: (entry: RunOnEntry | null) => void;
  onSetup?: (entry: RunOnEntry) => void;
  placement?: RunOnPlacement | null;
  onPlacementChange?: (placement: RunOnPlacement) => void;
  existingRoot?: string;
  onExistingPick?: (root: string) => void;
  existingWorktrees?: RunOnExistingWorktrees;
  thisDeviceId?: string;
  deviceName?: string;
  defaultOpen?: boolean;
};

export function placementLabel(
  placement: RunOnPlacement | null | undefined,
  existingRoot: string | undefined,
  existingTitle?: string,
) {
  if (existingRoot === undefined)
    return placement === "worktree" ? "New worktree" : "Current checkout";
  return placement === "worktree"
    ? (existingTitle ?? folderName(existingRoot))
    : `Current checkout (${folderName(existingRoot)})`;
}

function RunOnDeviceRow({
  entry,
  selected,
  onPick,
  onSetup,
}: {
  entry: RunOnEntry;
  selected: boolean;
  onPick: () => void;
  onSetup: () => void;
}) {
  const details = [deviceDescription(entry), entry.repoNote].filter(
    (part): part is string => part !== undefined,
  );
  const description = details.length === 0 ? undefined : details.join(" · ");
  const density = description === undefined ? "default" : "rich";
  return (
    <ResponsiveMenuItem
      data-track-owner="shared/new-thread/run-on-select.tsx#RunOnDeviceRow:ResponsiveMenuItem.1"
      data-density={density}
      disabled={!entry.connected}
      onClick={
        entry.connected ? (entry.setupNeeded ? onSetup : onPick) : undefined
      }
    >
      <SelectorRow
        density={density}
        icon={<HardwareIcon hardware={entry.hardware} />}
        label={
          <span className="flex min-w-0 items-center gap-2">
            <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap">
              {entry.name}
            </span>
            {entry.shared && entry.ownerName !== null ? (
              <span className="shrink-0 whitespace-nowrap text-muted-foreground-2">
                {entry.ownerName}
              </span>
            ) : null}
            {entry.connected ? (
              <StatusDot color="success" />
            ) : (
              <span className="shrink-0 whitespace-nowrap text-muted-foreground-2">
                {entry.lastConnectedAt === null
                  ? "Never"
                  : relativeTime(entry.lastConnectedAt)}
              </span>
            )}
          </span>
        }
        description={description}
        trailing={selected ? <SelectorCheck /> : undefined}
      />
    </ResponsiveMenuItem>
  );
}

function DevicesLoading() {
  return (
    <div className="flex h-(--h-menu-row) items-center gap-2 px-2">
      <SelectorSkeleton className="size-(--icon-sm) rounded-full" />
      <SelectorSkeleton className="h-3 w-32" />
    </div>
  );
}

export function RunOnSelect({
  devices = [],
  loading = false,
  failed = false,
  onRetry,
  value = null,
  unresolved,
  onChange,
  onSetup,
  placement,
  onPlacementChange,
  existingRoot,
  onExistingPick,
  existingWorktrees,
  thisDeviceId,
  deviceName = "computer",
  defaultOpen,
  className,
  ...props
}: RunOnSelectProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const others = devices.filter((d) => d.id !== thisDeviceId);
  const otherDevices = [
    ...others.filter((d) => !d.shared),
    ...others.filter((d) => d.shared),
  ];
  const existingTitle = existingWorktrees?.entries?.find(
    (e) => e.root === existingRoot,
  )?.title;
  const placementText = placementLabel(placement, existingRoot, existingTitle);
  const cloud = value === null && unresolved !== true;
  const selectedOther = otherDevices.find(
    (d) => value !== null && d.id === value.id,
  );

  return (
    <div data-slot="run-on-select" {...props}>
      <ResponsiveMenu open={open} onOpenChange={setOpen}>
        <MenuTrigger
          data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:ResponsiveMenuTrigger.1"
          render={
            <Button
              data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:Button[Machine]"
              variant="bare"
              size="auto-sm"
              aria-label="Machine"
              className={joinClasses("-m-1 min-w-0 shrink p-1", className)}
            />
          }
        >
          {cloud ? (
            <Icon name="cloud" size="sm" className={selectorTriggerIcon} />
          ) : (
            <HardwareIcon
              hardware={value?.hardware ?? null}
              className={selectorTriggerIcon}
            />
          )}
          {value === null && unresolved === true && loading ? (
            <SelectorSkeleton className="h-3 w-16" />
          ) : (
            <span className="min-w-0 truncate">
              {value === null
                ? unresolved === true
                  ? "Device unavailable"
                  : "Cloud"
                : value.name}
              {value !== null && placement != null ? (
                <span className="max-sm:hidden"> · {placementText}</span>
              ) : null}
            </span>
          )}
          {value?.connected === true ? <StatusDot color="success" /> : null}
          <SelectorChevron />
        </MenuTrigger>
        <MenuContent className="w-72">
          <MenuLabel>Machine</MenuLabel>
          <ResponsiveMenuItem
            data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:ResponsiveMenuItem.1"
            onClick={() => onChange?.(null)}
          >
            <SelectorItemIcon name="cloud" />
            <span className={selectorItemLabel}>Cloud</span>
            {cloud ? <SelectorCheck className="ml-auto" /> : null}
          </ResponsiveMenuItem>
          {loading ? (
            <DevicesLoading />
          ) : failed ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <span className="text-sm font-normal text-muted-foreground-2">
                Could not load devices
              </span>
              <Button
                data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:Button[Retry]"
                size="sm"
                variant="ghost"
                onClick={onRetry}
              >
                Retry
              </Button>
            </div>
          ) : otherDevices.length > 0 ? (
            <SelectorSubmenu
              icon={<Icon name="devices" size="sm" />}
              label="Other devices"
              value={selectedOther?.name ?? String(otherDevices.length)}
              valueClassName="max-w-24"
              contentClassName="w-72"
            >
              {otherDevices.map((entry) => (
                <RunOnDeviceRow
                  key={entry.id}
                  entry={entry}
                  selected={value !== null && value.id === entry.id}
                  onPick={() => onChange?.(entry)}
                  onSetup={() => onSetup?.(entry)}
                />
              ))}
            </SelectorSubmenu>
          ) : null}
          {value !== null &&
          placement != null &&
          onPlacementChange !== undefined ? (
            <>
              <MenuSeparator />
              <ResponsiveMenuItem
                data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:ResponsiveMenuItem.4"
                onClick={() => onPlacementChange("worktree")}
              >
                <SelectorItemIcon name="folder-add-left" />
                <span className={selectorItemLabel}>New worktree</span>
                {placement === "worktree" && existingRoot === undefined ? (
                  <SelectorCheck className="ml-auto" />
                ) : null}
              </ResponsiveMenuItem>
              {onExistingPick === undefined ? null : (
                <SelectorSubmenu
                  icon={<Icon name="folders" size="sm" />}
                  label="Existing worktree"
                  value={existingRoot === undefined ? undefined : placementText}
                  valueClassName="max-w-24"
                  contentClassName="w-96"
                >
                  {value.connected ? (
                    existingWorktrees === undefined ? (
                      <WorktreeScanning folders={value.folders} />
                    ) : (
                      <ExistingWorktreeRows
                        {...existingWorktrees}
                        selectedRoot={existingRoot}
                        linkedRoots={value.folders.map((f) => f.root)}
                        scanning={value.folders}
                        onPick={(entry) => onExistingPick(entry.root)}
                      />
                    )
                  ) : (
                    <ResponsiveMenuItem
                      data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:ResponsiveMenuItem.5"
                      disabled
                    >
                      <span className={selectorItemLabel}>
                        Open Capy on{" "}
                        {thisDeviceId === value.id
                          ? `this ${deviceName}`
                          : value.name}{" "}
                        to list worktrees
                      </span>
                    </ResponsiveMenuItem>
                  )}
                </SelectorSubmenu>
              )}
              <ResponsiveMenuItem
                data-track-owner="shared/new-thread/run-on-select.tsx#RunOnSelect:ResponsiveMenuItem.6"
                onClick={() => onPlacementChange("linked")}
              >
                <span className={selectorIconSlot}>
                  <Icon name="folder-1" size="sm" />
                </span>
                <span className={selectorItemLabel}>Current checkout</span>
                {placement === "linked" && existingRoot === undefined ? (
                  <SelectorCheck className="ml-auto" />
                ) : null}
              </ResponsiveMenuItem>
            </>
          ) : null}
        </MenuContent>
      </ResponsiveMenu>
    </div>
  );
}
