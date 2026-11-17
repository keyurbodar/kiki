import { useAtomSet } from "@effect/atom-react";
import { toast } from "sonner";
import {
  type DriveScope,
  driveReactivityKey,
  driveWriteAtom,
} from "@/data/atoms/agent-context";
import { useAgentOrg } from "./use-agent-scopes";

export type VolumeChange =
  | { path: string; content: string }
  | { path: string; delete: true };

const tagged = (error: unknown, tag: string) =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  error._tag === tag;

const rejectedMessage = (error: unknown, fallback: string) =>
  tagged(error, "capy/VolumeWriteRejected") &&
  typeof (error as { message?: unknown }).message === "string"
    ? (error as { message: string }).message
    : fallback;

const movedPaths = (error: unknown) =>
  tagged(error, "capy/VolumeHeadMoved") &&
  Array.isArray((error as { paths?: unknown }).paths)
    ? (error as { paths: string[] }).paths
    : undefined;

/** Capy's volume writer: writes changes into one scope and toasts the outcome. */
export function useVolumeWriter({
  scope,
  headDigest,
  onReload,
}: {
  scope: DriveScope;
  headDigest: string | null;
  onReload?: () => void;
}) {
  const { orgId } = useAgentOrg();
  const write = useAtomSet(driveWriteAtom, { mode: "promise" });
  const fail = (error: unknown, failure: string) => {
    const paths = movedPaths(error);
    if (paths === undefined) {
      toast.error(rejectedMessage(error, failure));
      return;
    }
    toast.error("Changed since you opened it", {
      description:
        paths.length === 0
          ? "Reload to see the latest files"
          : paths.join(", "),
      ...(onReload === undefined
        ? {}
        : { action: { label: "Reload", onClick: onReload } }),
    });
  };
  const put = (
    changes: ReadonlyArray<VolumeChange>,
    success: string,
    failure: string,
  ): Promise<boolean> =>
    orgId === undefined
      ? Promise.resolve(false)
      : write({
          params: { orgId },
          payload: { scope, expectedDigest: headDigest, changes },
          reactivityKeys: [driveReactivityKey(orgId)],
        }).then(
          () => {
            toast.success(success);
            return true;
          },
          (error: unknown) => {
            fail(error, failure);
            return false;
          },
        );
  return { put };
}
