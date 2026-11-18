import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import {
  denyAgentAccessAtom,
  denyComputerUseAtom,
  denyDeviceAccessAtom,
  grantAgentAccessAtom,
  grantComputerUseAtom,
  grantDeviceAccessAtom,
  threadDeviceKeys,
  withdrawDeviceAccessAtom,
} from "@/data/atoms/thread-devices";
import {
  permissionCallDetail,
  type RawAgentAccess,
  type RawDeviceAccess,
} from "@/features/thread/device-access-dialog";
import type { ThreadDevice } from "@/features/thread/device-chip";
import { toast } from "@/primitives/toaster";
import {
  DeviceAccessOwnerTakeoverView,
  DeviceAccessRequesterTakeoverView,
  DevicePermissionTakeoverView,
  type TakeoverBusy,
} from "./device-access-takeover";

type Requested = { status: string; requestedAt: Date };

export const oldestRequested = <T extends Requested>(
  rows: ReadonlyArray<T>,
): T | undefined =>
  rows
    .filter((row) => row.status === "requested")
    .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime())[0];

export const heldMessageFor = (
  rows: ReadonlyArray<RawDeviceAccess>,
  threadId: string,
) =>
  rows
    .flatMap((row) =>
      row.threadId === threadId &&
      (row.status === "requested" || row.status === "granted") &&
      row.held !== null
        ? [{ row, held: row.held }]
        : [],
    )
    .sort(
      (a, b) => a.row.requestedAt.getTime() - b.row.requestedAt.getTime(),
    )[0];

export type DeviceMessageTakeoverProps = {
  orgId: string;
  request: RawDeviceAccess;
  held: { text: string; fileCount: number; jamId: string };
  device: Pick<ThreadDevice, "deviceId" | "name">;
  memberName?: (userId: string) => string | undefined;
  onDismiss?: () => void;
};

export function DeviceMessageTakeover({
  orgId,
  request,
  held,
  device,
  memberName = () => undefined,
  onDismiss,
}: DeviceMessageTakeoverProps) {
  const grant = useAtomSet(grantDeviceAccessAtom, { mode: "promise" });
  const deny = useAtomSet(denyDeviceAccessAtom, { mode: "promise" });
  const [busy, setBusy] = useState<TakeoverBusy>();
  const act = (action: "grant" | "deny") => {
    setBusy(action);
    (action === "grant" ? grant : deny)({
      params: { orgId, deviceId: device.deviceId, accessId: request.id },
      reactivityKeys: [
        threadDeviceKeys.deviceAccess(orgId),
        threadDeviceKeys.jamEvents(held.jamId),
      ],
    })
      .catch(() =>
        toast.error(
          action === "grant"
            ? "Could not allow the message"
            : "Could not deny access",
        ),
      )
      .finally(() => setBusy(undefined));
  };
  return (
    <DeviceAccessOwnerTakeoverView
      member={memberName(request.userId) ?? "A teammate"}
      deviceName={device.name}
      text={held.text}
      fileCount={held.fileCount}
      busy={busy}
      grantLabel={request.status === "granted" ? "Deliver" : "Allow"}
      onGrant={() => act("grant")}
      onDeny={request.status === "requested" ? () => act("deny") : undefined}
      onDismiss={onDismiss}
    />
  );
}

export type DevicePermissionTakeoverProps = {
  orgId: string;
  request: RawAgentAccess & { requesterJamId: string };
  onDismiss?: () => void;
};

export function DevicePermissionTakeover({
  orgId,
  request,
  onDismiss,
}: DevicePermissionTakeoverProps) {
  const grantExecution = useAtomSet(grantAgentAccessAtom, { mode: "promise" });
  const denyExecution = useAtomSet(denyAgentAccessAtom, { mode: "promise" });
  const grantComputer = useAtomSet(grantComputerUseAtom, { mode: "promise" });
  const denyComputer = useAtomSet(denyComputerUseAtom, { mode: "promise" });
  const [busy, setBusy] = useState<TakeoverBusy>();
  const execution = request.capability === "execution";
  const act = (action: TakeoverBusy) => {
    setBusy(action);
    const params = { orgId, deviceId: request.deviceId, accessId: request.id };
    const reactivityKeys = [
      threadDeviceKeys.agentAccess(orgId),
      threadDeviceKeys.jamEvents(request.requesterJamId),
    ];
    const run =
      action === "deny"
        ? (execution ? denyExecution : denyComputer)({ params, reactivityKeys })
        : (execution ? grantExecution : grantComputer)({
            params,
            payload: { always: action === "always" },
            reactivityKeys,
          });
    run
      .catch(() =>
        toast.error(
          action === "deny"
            ? "Could not deny access"
            : "Could not allow access",
        ),
      )
      .finally(() => setBusy(undefined));
  };
  return (
    <DevicePermissionTakeoverView
      capability={request.capability}
      deviceName={request.deviceName}
      toolName={request.toolName}
      callLabel={request.toolName}
      callDetail={permissionCallDetail(request)}
      busy={busy}
      onGrant={() => act("grant")}
      onAlways={() => act("always")}
      onDeny={() => act("deny")}
      onDismiss={onDismiss}
    />
  );
}

export type DeviceAccessRequesterTakeoverProps = {
  orgId: string;
  device: ThreadDevice;
};

export function DeviceAccessRequesterTakeover({
  orgId,
  device,
}: DeviceAccessRequesterTakeoverProps) {
  const withdraw = useAtomSet(withdrawDeviceAccessAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const accessId = device.viewerAccessId;
  return (
    <DeviceAccessRequesterTakeoverView
      owner={device.ownerName ?? "the owner"}
      deviceName={device.name}
      text={device.viewerHeldText ?? ""}
      busy={busy}
      onWithdraw={
        accessId == null
          ? undefined
          : () => {
              setBusy(true);
              withdraw({
                params: { orgId, deviceId: device.deviceId, accessId },
                reactivityKeys: [threadDeviceKeys.deviceAccess(orgId)],
              })
                .catch(() => toast.error("Could not withdraw the request"))
                .finally(() => setBusy(false));
            }
      }
    />
  );
}
