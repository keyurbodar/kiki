import type { ReactNode } from "react";
import type { ThreadDevice } from "@/features/thread/device-chip";
import { LoadingButton } from "@/lib/loading-button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";

export type StatusCardStatus = "pending" | "success" | "failed" | "stopped";

export type StatusCardProps = {
  status: StatusCardStatus;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

export function StatusCard({
  status,
  title,
  description,
  action,
}: StatusCardProps) {
  const iconClass = "size-(--icon-base) shrink-0";
  return (
    <div data-slot="status-card" className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1">
        {status === "pending" ? (
          <DotGridIcon
            size="inherit"
            aria-label="Waiting"
            className={`${iconClass} text-muted-foreground-1`}
          />
        ) : (
          <Icon
            name={status === "success" ? "circle-check" : "circle-x"}
            className={`${iconClass} ${
              status === "success"
                ? "text-success"
                : status === "failed"
                  ? "text-destructive"
                  : "text-muted-foreground-2"
            }`}
          />
        )}
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

export type DeviceAccessGateStatus = "requested" | "revoked";

export type DeviceAccessGateProps = {
  device: Pick<ThreadDevice, "name">;
  status: DeviceAccessGateStatus;
  stop?: { disabled?: boolean; pending?: boolean; onStop: () => void };
};

export const deviceAccessGateCopy = (
  status: DeviceAccessGateStatus,
  deviceName: string,
) =>
  status === "requested"
    ? {
        title: "Access requested",
        description: `This thread runs on ${deviceName}, send again once the owner approves`,
      }
    : {
        title: "Access revoked",
        description: `The owner of ${deviceName} revoked access to this thread`,
      };

export const gateStatus = (
  device: { viewerAccess?: string } | null | undefined,
): DeviceAccessGateStatus | null =>
  device != null &&
  (device.viewerAccess === "requested" || device.viewerAccess === "revoked")
    ? device.viewerAccess
    : null;

export function DeviceAccessGate({
  device,
  status,
  stop,
}: DeviceAccessGateProps) {
  const copy = deviceAccessGateCopy(status, device.name);
  return (
    <div
      data-slot="device-access-gate"
      className="rounded-(--radius-card) border-hairline border-border-2 bg-popover p-4 shadow-composer"
    >
      <StatusCard
        status={status === "requested" ? "pending" : "stopped"}
        title={copy.title}
        description={copy.description}
        action={
          stop === undefined ? null : (
            <LoadingButton
              size="sm"
              variant="soft"
              disabled={stop.disabled}
              loading={stop.pending}
              onClick={stop.onStop}
            >
              Stop run
            </LoadingButton>
          )
        }
      />
    </div>
  );
}
