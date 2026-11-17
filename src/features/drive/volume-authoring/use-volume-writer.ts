import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DriveStorage, VolumeWriteChange } from "@/data/api/schemas/drive";
import type { DriveScopeQuery } from "@/data/atoms/drive";
import {
  driveReactivityKey,
  driveRestore,
  driveWrite,
} from "@/data/atoms/drive";

const tagged = (
  error: unknown,
  tag: string,
): error is Record<string, unknown> =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  error._tag === tag;

/** How a failed drive write should surface, as Capy's volume writer decides it. */
export function writeFailure(error: unknown, fallback: string) {
  if (tagged(error, "capy/DriveFull")) {
    return {
      kind: "full" as const,
      facts: {
        usedBytes: Number(error.usedBytes ?? 0),
        limitBytes: Number(error.limitBytes ?? 0),
        tier: (error.tier ?? null) as DriveStorage["tier"],
      },
    };
  }
  if (tagged(error, "capy/VolumeHeadMoved") && Array.isArray(error.paths)) {
    return { kind: "moved" as const, paths: error.paths as Array<string> };
  }
  if (
    tagged(error, "capy/VolumeWriteRejected") &&
    typeof error.message === "string"
  ) {
    return { kind: "error" as const, message: error.message };
  }
  return { kind: "error" as const, message: fallback };
}

export interface VolumeWriterOptions {
  readonly orgId: string | undefined;
  readonly scope: DriveScopeQuery | undefined;
  readonly headDigest: string | null;
  readonly onDriveFull: () => void;
  readonly onReload: () => void;
}

/** Writes and restores one drive scope, with Capy's toasts and drive-full state. */
export function useVolumeWriter({
  orgId,
  scope,
  headDigest,
  onDriveFull,
  onReload,
}: VolumeWriterOptions) {
  const write = useAtomSet(driveWrite, { mode: "promise" });
  const restoreVersion = useAtomSet(driveRestore, { mode: "promise" });
  const identity = `${orgId}:${JSON.stringify(scope ?? null)}`;
  const [full, setFull] = useState<{
    identity: string;
    facts: DriveStorage;
  }>();

  const fail = (error: unknown, fallback: string) => {
    const failure = writeFailure(error, fallback);
    if (failure.kind === "full") {
      setFull({ identity, facts: failure.facts });
      onDriveFull();
      return;
    }
    if (failure.kind === "moved") {
      toast.error("Changed since you opened it", {
        description:
          failure.paths.length === 0
            ? "Reload to see the latest files"
            : failure.paths.join(", "),
        action: { label: "Reload", onClick: onReload },
      });
      return;
    }
    toast.error(failure.message);
  };

  const put = (
    changes: ReadonlyArray<VolumeWriteChange>,
    success: string,
    failure: string,
  ): Promise<boolean> =>
    orgId === undefined || scope === undefined
      ? Promise.resolve(false)
      : write({
          params: { orgId: orgId as never },
          payload: {
            scope: scope as never,
            expectedDigest: headDigest as never,
            changes: [...changes],
          },
          reactivityKeys: [driveReactivityKey(orgId)],
        }).then(
          () => {
            setFull(undefined);
            toast.success(success);
            return true;
          },
          (error: unknown) => {
            fail(error, failure);
            return false;
          },
        );

  const restore = (
    volumeId: string,
    versionId: string,
    expectedDigest: string,
  ): Promise<boolean> =>
    orgId === undefined
      ? Promise.resolve(false)
      : restoreVersion({
          params: { orgId: orgId as never, volumeId: volumeId as never },
          payload: {
            versionId: versionId as never,
            expectedDigest: expectedDigest as never,
          },
          reactivityKeys: [driveReactivityKey(orgId)],
        }).then(
          () => {
            setFull(undefined);
            toast.success("Version restored");
            return true;
          },
          (error: unknown) => {
            fail(error, "Could not restore version");
            return false;
          },
        );

  return {
    driveFull: full?.identity === identity ? full.facts : undefined,
    put,
    restore,
  };
}
