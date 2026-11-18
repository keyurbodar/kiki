import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import { badgeVariants } from "@/primitives/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  devicePresence,
  presenceColor,
  presenceLabel,
  type StatusColor,
  type ThreadDevice,
  type ThreadMachine,
  workspaceKindLabel,
} from "./device";

const statusDotColors: Record<StatusColor, string> = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

export type StatusDotProps = { color?: StatusColor; className?: string };

export function StatusDot({ color = "neutral", className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      data-slot="status-dot"
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        statusDotColors[color],
        className,
      )}
    />
  );
}

export function useDevicePresence(machine: ThreadMachine | null) {
  const [now, setNow] = useState(() => Date.now());
  const presence =
    machine === null
      ? { kind: "connected" as const }
      : devicePresence(machine, now);
  const ticking = presence.kind === "reconnecting" && presence.until !== null;
  const changedAt = machine?.stateChangedAt?.getTime();
  useEffect(() => {
    if (!ticking || changedAt === undefined) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ticking, changedAt]);
  return { presence, label: presenceLabel(presence, now), now };
}

export type DeviceChipProps = {
  machine: ThreadMachine | null;
  device: ThreadDevice;
  popoverDefaultOpen?: boolean;
};

export function DeviceChip({
  machine,
  device,
  popoverDefaultOpen,
}: DeviceChipProps) {
  const { presence, label } = useDevicePresence(machine);
  const kind = workspaceKindLabel(device.workspaceKind);
  return (
    <span
      data-slot="device-chip"
      className="flex min-w-0 shrink items-center gap-1.5"
    >
      <span className="min-w-0 truncate text-xs text-muted-foreground-2">
        {kind}
      </span>
      <Popover defaultOpen={popoverDefaultOpen}>
        <PopoverTrigger
          aria-label="Device workspace"
          data-slot="badge"
          data-size="sm"
          className={badgeVariants({
            interactive: true,
            className: "shrink-0",
          })}
        >
          <StatusDot color={presenceColor(presence)} />
          {device.name}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {device.name}
            </span>
            <span className="text-xs break-all text-muted-foreground-1">
              {device.workspaceRoot}
            </span>
            <span className="text-xs text-muted-foreground-2">
              {kind} · {label}
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
