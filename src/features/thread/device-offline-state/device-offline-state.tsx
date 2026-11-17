import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { openHandoffAtom, threadDeviceKeys } from "@/data/atoms/thread-devices";
import {
  type MachineLifetime,
  offlineHint,
  type ThreadDevice,
} from "@/features/thread/device-chip";
import { LoadingButton } from "@/lib/loading-button";
import sleepArt from "./assets/sleep.svg";

export type EmptyArtStateProps = {
  art: string;
  line: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
};

export function EmptyArtState({ art, line, sub, action }: EmptyArtStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
        {line}
      </span>
      {sub !== undefined && (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {action !== undefined && <span className="mt-2">{action}</span>}
    </div>
  );
}

export const HANDOFF_FAILURES: Record<string, string> = {
  DeviceOffline: "The device is offline",
  NotOnDevice: "This thread is no longer on a device",
  DeviceGone: "The device is no longer available",
  HandoffRunning: "A handoff is already running",
  InsufficientCredits: "Not enough credits for a cloud machine",
  DailyAllowanceSpent: "The daily cloud allowance is spent",
  MemoryBudgetFull: "The organization's machine memory budget is full",
};

export function handoffFailure(cause: unknown): string {
  const tag =
    typeof cause === "object" && cause !== null && "_tag" in cause
      ? String((cause as { _tag: unknown })._tag)
      : undefined;
  return (
    (tag !== undefined && HANDOFF_FAILURES[tag]) ||
    "The handoff could not start"
  );
}

export const checkpointStaged = (lifetime: MachineLifetime) =>
  lifetime.machine?.attachments.find((a) => a.jamId === lifetime.jamId)
    ?.checkpointStaged === true;

export type DeviceOfflineStateViewProps = {
  device: ThreadDevice;
  canMove: boolean;
  moving: boolean;
  onMoveToCloud?: () => void;
};

export function DeviceOfflineStateView({
  device,
  canMove,
  moving,
  onMoveToCloud,
}: DeviceOfflineStateViewProps) {
  return (
    <EmptyArtState
      art={sleepArt}
      line="Device is offline"
      sub={offlineHint(device)}
      action={
        canMove ? (
          <LoadingButton
            variant="outline"
            size="xs"
            loading={moving}
            loadingLabel="Moving to cloud"
            onClick={onMoveToCloud}
          >
            Move to cloud
          </LoadingButton>
        ) : undefined
      }
    />
  );
}

export type DeviceOfflineStateProps = {
  orgId: string | undefined;
  lifetime: MachineLifetime;
  device: ThreadDevice;
  handoffRunning?: boolean;
};

export function DeviceOfflineState({
  orgId,
  lifetime,
  device,
  handoffRunning = false,
}: DeviceOfflineStateProps) {
  const open = useAtomSet(openHandoffAtom, { mode: "promiseExit" });
  const [moving, setMoving] = useState(false);
  const moveToCloud = () => {
    if (orgId === undefined) return;
    setMoving(true);
    open({
      params: { orgId, jamId: lifetime.jamId },
      payload: { destination: "cloud", fromCheckpoint: true },
      reactivityKeys: [threadDeviceKeys.jam(device.rootJamId)],
    }).then((exit) => {
      setMoving(false);
      if (Exit.isFailure(exit)) {
        toast.error("Could not move to cloud", {
          description: handoffFailure(
            exit.cause.reasons.find((r) => r._tag === "Fail")?.error,
          ),
        });
      }
    });
  };
  return (
    <DeviceOfflineStateView
      device={device}
      canMove={checkpointStaged(lifetime)}
      moving={moving || handoffRunning}
      onMoveToCloud={moveToCloud}
    />
  );
}
