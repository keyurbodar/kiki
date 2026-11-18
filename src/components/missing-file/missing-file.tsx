import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import type { VolumeId } from "@/data/api/schemas/drive";
import type { OrgId } from "@/data/api/schemas/ids";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { useActiveOrgId } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { FileState } from "./file-state";

export type MissingFileStatus =
  | { kind: "checking" }
  | { kind: "unchecked" }
  | { kind: "absent" }
  | {
      kind: "deleted";
      lastVersionId: string;
      removedAt: string | null;
      thread: string | null;
      author: string | null;
    };

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export function formatRelative(at: string | number | Date, now = Date.now()) {
  const delta = now - (typeof at === "number" ? at : new Date(at).getTime());
  const size = Math.abs(delta);
  if (size < 5 * second) return "just now";
  const amount =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
}

const text = (value: unknown) => (typeof value === "string" ? value : null);

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

export function missingFileStatus(
  result: AsyncResult.AsyncResult<unknown, unknown>,
): MissingFileStatus {
  const versions = Option.getOrUndefined(AsyncResult.value(result));
  if (!Array.isArray(versions))
    return AsyncResult.isFailure(result)
      ? { kind: "unchecked" }
      : { kind: "checking" };
  const last = record(versions[0]);
  if (last === undefined) return { kind: "absent" };
  const removedBy = record(last.removedBy);
  return {
    kind: "deleted",
    lastVersionId: String(last.versionId),
    removedAt: text(removedBy?.createdAt),
    thread: text(removedBy?.threadTitle),
    author: text(removedBy?.authorName),
  };
}

export function deletedSummary(
  status: Extract<MissingFileStatus, { kind: "deleted" }>,
  now?: number,
) {
  if (status.removedAt === null)
    return "Its removal has aged out of this drive's history";
  const when = formatRelative(status.removedAt, now);
  if (status.thread !== null) return `Deleted ${when} in ${status.thread}`;
  if (status.author !== null) return `Deleted ${when} by ${status.author}`;
  return `Deleted ${when}`;
}

export type MissingFileStateProps = {
  state: MissingFileStatus;
  absent: string;
  onRetry: () => void;
  onOpenVersion: (versionId: string) => void;
};

export function MissingFileState({
  state,
  absent,
  onRetry,
  onOpenVersion,
}: MissingFileStateProps) {
  const retry = (
    <Button
      data-track-owner="shared/drive/missing-file.tsx#MissingFileState:Button[Retry]"
      variant="ghost"
      size="xs"
      onClick={onRetry}
    >
      Retry
    </Button>
  );
  if (state.kind === "checking")
    return <FileState line="File not found" sub="Checking its history" />;
  if (state.kind === "unchecked")
    return (
      <FileState
        line="File not found"
        sub="History unavailable"
        action={retry}
      />
    );
  if (state.kind === "absent")
    return <FileState line="File not found" sub={absent} action={retry} />;
  return (
    <FileState
      line="File deleted"
      sub={deletedSummary(state)}
      action={
        <Button
          data-track-owner="shared/drive/missing-file.tsx#MissingFileState:Button[Open last version]"
          variant="ghost"
          size="xs"
          onClick={() => onOpenVersion(state.lastVersionId)}
        >
          Open last version
        </Button>
      }
    />
  );
}

export const fileVersionsAtom = Atom.family((key: string) => {
  const [orgId = "", volumeId = "", path = ""] = JSON.parse(key) as string[];
  return ApiClient.query("volumes", "fileVersions", {
    params: { orgId: orgId as OrgId, volumeId: volumeId as VolumeId },
    query: { path },
    reactivityKeys: [`volume:${orgId}`],
    timeToLive: queryTimeToLive,
  });
});

const pendingAtom = Atom.make(AsyncResult.initial<unknown, unknown>(true));

export type MissingFileProps = Omit<MissingFileStateProps, "state"> & {
  volumeId: string;
  path: string;
  /** Overrides the first organization when file history is scope-specific. */
  orgId?: string;
};

export function MissingFile({
  volumeId,
  path,
  onRetry,
  orgId: orgIdProp,
  ...props
}: MissingFileProps) {
  const activeOrgId = useActiveOrgId();
  const orgId = orgIdProp ?? activeOrgId;
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    orgId === undefined
      ? pendingAtom
      : fileVersionsAtom(JSON.stringify([orgId, volumeId, path]));
  const refresh = useAtomRefresh(atom);
  return (
    <MissingFileState
      {...props}
      state={missingFileStatus(useAtomValue(atom))}
      onRetry={() => {
        refresh();
        onRetry();
      }}
    />
  );
}
