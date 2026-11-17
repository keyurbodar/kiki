import type { ReactNode } from "react";
import type { DeviceHardware, DeviceOs } from "@/data/api/schemas/devices";
import { Button } from "@/primitives/button";
import { DialogFooter } from "@/primitives/dialog";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import { cx } from "../shared";
import {
  ArrowUpRightIcon,
  CloudIcon,
  MacbookIcon,
  ServerIcon,
  StudioDisplayThunderboltIcon,
} from "./icons";
import { type StatusColor, statusDotColors } from "./status";

export function DeviceIcon({ os }: { os: DeviceOs }) {
  return os === "darwin" ? <MacbookIcon /> : <Icon name="studio-display" />;
}

export function HardwareIcon({
  hardware,
  className,
}: {
  hardware: DeviceHardware;
  className?: string;
}) {
  switch (hardware.formFactor) {
    case "laptop":
      return <MacbookIcon className={className} />;
    case "desktop":
      return <StudioDisplayThunderboltIcon className={className} />;
    case "server":
      return <ServerIcon className={className} />;
    case "cloud":
      return <CloudIcon className={className} />;
    default:
      return <Icon name="studio-display" className={className} />;
  }
}

export function StatusDot({
  color = "neutral",
  className,
}: {
  color?: StatusColor;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        statusDotColors[color],
        className,
      )}
    />
  );
}

export type ConnectHelpLink = { href: string; label: string };

export function ConnectHelp({
  help,
  className,
}: {
  help: ConnectHelpLink;
  className?: string;
}) {
  return (
    <Button
      variant="link"
      size="auto-xs"
      className={cx("focus-gutter", className)}
      render={<a href={help.href} target="_blank" rel="noopener noreferrer" />}
    >
      {help.label}
      <ArrowUpRightIcon className="size-(--icon-xs)" />
    </Button>
  );
}

export function ConnectFooter({
  help,
  onCancel,
  cancelLabel = "Cancel",
  disabled,
  secondary,
  children,
}: {
  help?: ConnectHelpLink;
  onCancel: () => void;
  cancelLabel?: string;
  disabled?: boolean;
  secondary?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <DialogFooter className="items-center">
      {help === undefined ? null : (
        <ConnectHelp help={help} className="mr-auto" />
      )}
      {secondary}
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      {children}
    </DialogFooter>
  );
}

export type ConnectWaitStatus = "pending" | "success" | "failed" | "stopped";

function ConnectWaitIcon({
  status,
  size,
}: {
  status: ConnectWaitStatus;
  size: "base" | "inline";
}) {
  const sizeClass =
    size === "inline" ? "size-4 shrink-0" : "size-(--icon-base) shrink-0";
  if (status === "pending") {
    return (
      <DotGridIcon
        size="inherit"
        role="status"
        aria-label="Waiting"
        className={cx(sizeClass, "text-muted-foreground-1")}
      />
    );
  }
  const className = cx(
    sizeClass,
    status === "success"
      ? "text-success"
      : status === "failed"
        ? "text-destructive"
        : "text-muted-foreground-2",
  );
  return status === "success" ? (
    <Icon name="circle-check" className={className} />
  ) : (
    <Icon name="circle-x" className={className} />
  );
}

export function ConnectWait({
  status,
  title,
  description,
  action,
  size = "base",
}: {
  status: ConnectWaitStatus;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  size?: "base" | "inline";
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className={cx(
          "grid grid-cols-[auto_minmax(0,1fr)] gap-y-1",
          size === "inline" ? "gap-x-2" : "gap-x-2.5",
        )}
      >
        <ConnectWaitIcon status={status} size={size} />
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="col-start-2 text-sm font-normal text-muted-foreground-2">
          {description}
        </p>
      </div>
      {action != null && (
        <div className="flex flex-wrap justify-end gap-2">{action}</div>
      )}
    </div>
  );
}
