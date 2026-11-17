import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  denyAgentAccessAtom,
  denyComputerUseAtom,
  denyDeviceAccessAtom,
  deviceAccessListAtom,
  grantAgentAccessAtom,
  grantComputerUseAtom,
  grantDeviceAccessAtom,
  revokeAgentAccessAtom,
  revokeComputerUseAtom,
  revokeDeviceAccessAtom,
  threadAgentAccessAtom,
  threadDeviceKeys,
} from "@/data/atoms/thread-devices";
import type { ThreadDevice } from "@/features/thread/device-chip";
import { LoadingButton } from "@/lib/loading-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import {
  type AccessAction,
  type AgentAccessRow,
  accessFailure,
  deviceAgentRow,
  messageAccessRows,
  parseAgentAccess,
  parseDeviceAccess,
} from "./access";
import { DeviceAccessList, DeviceAgentAccessList } from "./device-access-lists";

export const deviceAccessDescription = (device: ThreadDevice | undefined) =>
  device === undefined
    ? "Devices and Slack access Capy asked for from this thread. Everything it runs on a device uses your local git identity, and Slack is read only"
    : `Who can message this thread on ${device.name}, and which devices and Slack access Capy asked for from it. Everything runs under your local git identity`;

export function AccessSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="shimmer-surface shimmer-surface-motion-safe h-3 w-40 rounded" />
      <div className="shimmer-surface shimmer-surface-motion-safe h-3 w-24 rounded" />
    </div>
  );
}

export type AccessErrorProps = { message: string; onRetry: () => void };

export function AccessError({ message, onRetry }: AccessErrorProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-muted-foreground-1">{message}</span>
      <LoadingButton size="xs" onClick={onRetry}>
        Retry
      </LoadingButton>
    </div>
  );
}

const failedWithoutValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isFailure(result) && Option.isNone(result.previousSuccess);

export type DeviceMessageAccessSectionProps = {
  orgId: string;
  device: ThreadDevice;
  memberName?: (userId: string) => string | undefined;
};

export function DeviceMessageAccessSection({
  orgId,
  device,
  memberName = () => undefined,
}: DeviceMessageAccessSectionProps) {
  const atom = deviceAccessListAtom(`${orgId}/${device.deviceId}`);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const grant = useAtomSet(grantDeviceAccessAtom, { mode: "promise" });
  const deny = useAtomSet(denyDeviceAccessAtom, { mode: "promise" });
  const revoke = useAtomSet(revokeDeviceAccessAtom, { mode: "promise" });
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (AsyncResult.isInitial(result)) return <AccessSkeleton />;
  if (failedWithoutValue(result)) {
    return <AccessError message="Could not load access" onRetry={refresh} />;
  }
  const rows = messageAccessRows(
    parseDeviceAccess(Option.getOrUndefined(AsyncResult.value(result))),
    device.rootJamId,
    memberName,
  );
  const act = (action: AccessAction, accessId: string) => {
    setPendingId(`${action}:${accessId}`);
    const mutate =
      action === "grant" ? grant : action === "deny" ? deny : revoke;
    mutate({
      params: { orgId, deviceId: device.deviceId, accessId },
      reactivityKeys: [
        threadDeviceKeys.deviceAccess(orgId),
        threadDeviceKeys.jamEvents(device.rootJamId),
      ],
    })
      .catch(() => toast.error(accessFailure(action)))
      .finally(() => setPendingId(null));
  };
  return (
    <DeviceAccessList
      rows={rows}
      pendingId={pendingId}
      onGrant={(id) => act("grant", id)}
      onDeny={(id) => act("deny", id)}
      onRevoke={(id) => act("revoke", id)}
    />
  );
}

export type DeviceAgentAccessSectionProps = { orgId: string; threadId: string };

export function DeviceAgentAccessSection({
  orgId,
  threadId,
}: DeviceAgentAccessSectionProps) {
  const atom = threadAgentAccessAtom(`${orgId}/${threadId}`);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const mutations = {
    execution: {
      grant: useAtomSet(grantAgentAccessAtom, { mode: "promise" }),
      deny: useAtomSet(denyAgentAccessAtom, { mode: "promise" }),
      revoke: useAtomSet(revokeAgentAccessAtom, { mode: "promise" }),
    },
    computer_use: {
      grant: useAtomSet(grantComputerUseAtom, { mode: "promise" }),
      deny: useAtomSet(denyComputerUseAtom, { mode: "promise" }),
      revoke: useAtomSet(revokeComputerUseAtom, { mode: "promise" }),
    },
  };
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (AsyncResult.isInitial(result)) return <AccessSkeleton />;
  if (failedWithoutValue(result)) {
    return (
      <AccessError message="Could not load agent access" onRetry={refresh} />
    );
  }
  const rows = parseAgentAccess(
    Option.getOrUndefined(AsyncResult.value(result)),
  ).map(deviceAgentRow);
  const act = (action: AccessAction, row: AgentAccessRow) => {
    if (row.target.kind !== "device") return;
    setPendingId(`${action}:${row.id}`);
    const params = { orgId, deviceId: row.target.deviceId, accessId: row.id };
    const reactivityKeys = [
      threadDeviceKeys.agentAccess(orgId),
      threadDeviceKeys.jamEvents(threadId),
    ];
    const group = mutations[row.target.capability];
    const request =
      action === "grant"
        ? group.grant({ params, payload: {}, reactivityKeys })
        : group[action]({ params, reactivityKeys });
    request
      .catch(() => toast.error(accessFailure(action)))
      .finally(() => setPendingId(null));
  };
  return (
    <DeviceAgentAccessList
      rows={rows}
      pendingId={pendingId}
      onGrant={(row) => act("grant", row)}
      onDeny={(row) => act("deny", row)}
      onRevoke={(row) => act("revoke", row)}
    />
  );
}

export type DeviceAccessDialogViewProps = {
  device?: ThreadDevice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageAccess?: ReactNode;
  agentAccess: ReactNode;
};

export function DeviceAccessDialogView({
  device,
  open,
  onOpenChange,
  messageAccess,
  agentAccess,
}: DeviceAccessDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Device access</DialogTitle>
          <DialogDescription>
            {deviceAccessDescription(device)}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {device !== undefined && (
            <>
              <div className="flex flex-col gap-1 pb-1">
                <span className="text-sm font-medium text-foreground">
                  Message access
                </span>
              </div>
              {messageAccess}
              <div className="mt-4 flex flex-col gap-1 border-t-hairline border-border-1 pt-4">
                <span className="text-sm font-medium text-foreground">
                  Agent access
                </span>
              </div>
            </>
          )}
          {agentAccess}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type DeviceAccessDialogProps = {
  orgId: string;
  threadId: string;
  device?: ThreadDevice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName?: (userId: string) => string | undefined;
};

export function DeviceAccessDialog({
  orgId,
  threadId,
  device,
  open,
  onOpenChange,
  memberName,
}: DeviceAccessDialogProps) {
  return (
    <DeviceAccessDialogView
      device={device}
      open={open}
      onOpenChange={onOpenChange}
      messageAccess={
        device !== undefined && (
          <DeviceMessageAccessSection
            orgId={orgId}
            device={device}
            memberName={memberName}
          />
        )
      }
      agentAccess={
        <DeviceAgentAccessSection orgId={orgId} threadId={threadId} />
      }
    />
  );
}
