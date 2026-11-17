import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactElement, useState } from "react";
import { toast } from "sonner";
import type { VolumeChange, VolumeVersionRow } from "@/data/api/schemas/drive";
import {
  driveChangesAtom,
  drivePurgeName,
  driveReactivityKey,
  driveVersionsAtom,
} from "@/data/atoms/drive";
import { ChevronDownSmallIcon } from "@/features/drive/drive-detail-page/icons";
import { HistoryIcon } from "@/features/drive/icons";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { menuRowVariants } from "@/primitives/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  changeLabels,
  changePageSize,
  groupHolds,
  holdCopy,
  holdSeqLabel,
  isPurgeRefusal,
  type PurgeRefusal,
  versionMeta,
  versionTitle,
} from "./history";

const listClassName =
  "-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1 md:scroll-fade-y";

const value = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

export interface VolumeHistoryProps {
  readonly orgId: string;
  readonly volumeId: string;
  /** Version ids that are a volume's current head. */
  readonly heads: ReadonlySet<string>;
  readonly onRestore?: (version: VolumeVersionRow) => void;
  /** Org admins can purge deleted names. */
  readonly isAdmin: boolean;
  /** Replaces the default ghost History icon button. */
  readonly trigger?: ReactElement;
}

/** The History popover: versions of a drive, their changes, restore and purge. */
export function VolumeHistory({
  orgId,
  volumeId,
  heads,
  onRestore,
  isAdmin,
  trigger,
}: VolumeHistoryProps) {
  const purge = useAtomSet(drivePurgeName, { mode: "promise" });
  const [target, setTarget] = useState<{ volumeId: string; path: string }>();
  const [purging, setPurging] = useState(false);
  const [refusal, setRefusal] = useState<PurgeRefusal>();
  const close = () => {
    setTarget(undefined);
    setRefusal(undefined);
  };
  const confirm = () => {
    if (target === undefined) return;
    setPurging(true);
    purge({
      params: {
        orgId: orgId as never,
        volumeId: target.volumeId as never,
      },
      payload: { path: target.path },
      reactivityKeys: [driveReactivityKey(orgId)],
    }).then(
      () => {
        setPurging(false);
        close();
        toast.success("Name purged");
      },
      (error: unknown) => {
        setPurging(false);
        if (isPurgeRefusal(error)) {
          setRefusal({ reason: error.reason, holds: error.holds });
          return;
        }
        close();
        toast.error("Could not purge name");
      },
    );
  };
  return (
    <>
      <Popover>
        {trigger === undefined ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="History"
                    />
                  }
                >
                  <HistoryIcon />
                </PopoverTrigger>
              }
            />
            <TooltipContent side="bottom">History</TooltipContent>
          </Tooltip>
        ) : (
          <PopoverTrigger render={trigger} />
        )}
        <PopoverContent
          align={trigger === undefined ? "end" : "start"}
          className="w-80"
        >
          <VolumeHistoryList
            orgId={orgId}
            volumeId={volumeId}
            heads={heads}
            onRestore={onRestore}
            onPurge={isAdmin ? setTarget : undefined}
          />
        </PopoverContent>
      </Popover>
      <PurgeNameDialog
        path={target?.path}
        preConversion={false}
        purging={purging}
        refusal={refusal}
        onOpenChange={(open) => !open && close()}
        onConfirm={confirm}
      />
    </>
  );
}

export interface VolumeHistoryListProps {
  readonly orgId: string;
  readonly volumeId: string;
  readonly heads: ReadonlySet<string>;
  readonly onRestore?: (version: VolumeVersionRow) => void;
  readonly onPurge?: (target: { volumeId: string; path: string }) => void;
}

export function VolumeHistoryList({
  orgId,
  volumeId,
  heads,
  onRestore,
  onPurge,
}: VolumeHistoryListProps) {
  const result = useAtomValue(driveVersionsAtom(orgId, volumeId));
  const versions = value(result);
  const [expanded, setExpanded] = useState<string>();
  const now = Date.now();
  if (versions === undefined) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {AsyncResult.isFailure(result) ? (
          <span className="text-sm font-normal text-muted-foreground-2">
            History unavailable
          </span>
        ) : (
          <>
            <SkeletonPanel className="h-4 w-48" />
            <SkeletonPanel className="h-4 w-36" />
          </>
        )}
      </div>
    );
  }
  if (versions.length === 0) {
    return (
      <div className="p-2 text-sm font-normal text-muted-foreground-2">
        No versions yet
      </div>
    );
  }
  return (
    <div className={listClassName}>
      {versions.map((version) => {
        const current = heads.has(version.id);
        const open = expanded === version.id;
        const body = (
          <span className="flex min-w-0 flex-1 flex-col py-0.5">
            <span className="truncate text-sm text-foreground">
              {versionTitle(version)}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground-2">
              {versionMeta(version, { now, current })}
            </span>
          </span>
        );
        return (
          <div key={version.id} className="flex flex-col">
            <div className="flex items-center">
              {version.threadId === null ? (
                <div
                  className={cx(
                    menuRowVariants({ density: "rich" }),
                    "min-w-0 flex-1",
                  )}
                >
                  {body}
                </div>
              ) : (
                <Link
                  to="/thread/$threadId"
                  params={{ threadId: version.threadId }}
                  className={cx(
                    menuRowVariants({ density: "rich", interaction: "button" }),
                    "min-w-0 flex-1",
                  )}
                >
                  {body}
                </Link>
              )}
              <span className="ml-1 flex shrink-0 items-center">
                {current || onRestore === undefined ? null : (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Restore this version"
                          className="shrink-0"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onRestore(version);
                          }}
                        >
                          <Icon name="rotate" />
                        </Button>
                      }
                    />
                    <TooltipContent side="bottom">Restore</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={open ? "Hide changes" : "Show changes"}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded(open ? undefined : version.id)
                        }
                      >
                        <ChevronDownSmallIcon
                          className={cx(open && "rotate-180")}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">Changes</TooltipContent>
                </Tooltip>
              </span>
            </div>
            {open && (
              <VolumeVersionChanges
                orgId={orgId}
                volumeId={version.volumeId}
                versionId={version.id}
                onPurge={onPurge}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChangesLine({ line }: { readonly line: string }) {
  return (
    <div className="py-1.5 pr-2 pl-4 text-xs font-normal text-muted-foreground-2">
      {line}
    </div>
  );
}

function VolumeVersionChanges({
  orgId,
  volumeId,
  versionId,
  onPurge,
}: {
  readonly orgId: string;
  readonly volumeId: string;
  readonly versionId: string;
  readonly onPurge?: (target: { volumeId: string; path: string }) => void;
}) {
  const result = useAtomValue(driveChangesAtom(orgId, volumeId, versionId));
  const changes = value(result);
  if (changes === undefined) {
    return AsyncResult.isFailure(result) ? (
      <ChangesLine line="Changes unavailable" />
    ) : (
      <div className="flex flex-col gap-1.5 py-1.5 pr-2 pl-4">
        <SkeletonPanel className="h-3.5 w-44" />
        <SkeletonPanel className="h-3.5 w-32" />
      </div>
    );
  }
  return (
    <VolumeChangeRows
      complete={changes.complete}
      changes={changes.changes}
      onPurge={
        onPurge === undefined
          ? undefined
          : (path) => onPurge({ volumeId, path })
      }
    />
  );
}

export interface VolumeChangeRowsProps {
  readonly complete: boolean;
  readonly changes: ReadonlyArray<
    Pick<VolumeChange, "path" | "change" | "movedFrom">
  >;
  readonly onPurge?: (path: string) => void;
}

export function VolumeChangeRows({
  complete,
  changes,
  onPurge,
}: VolumeChangeRowsProps) {
  const [pages, setPages] = useState(1);
  if (!complete) {
    return <ChangesLine line="Changes not available for this version" />;
  }
  if (changes.length === 0) return <ChangesLine line="No file changes" />;
  const shown = changes.slice(0, pages * changePageSize);
  return (
    <div className="flex flex-col pb-1 pl-2">
      {shown.map((change) => (
        <div
          key={change.path}
          className="flex min-h-7 items-center gap-2 rounded pr-1 pl-2 text-xs font-normal"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={cx(
                "truncate text-foreground",
                change.change === "deleted" &&
                  "text-muted-foreground-2 line-through",
              )}
            >
              {change.path}
            </span>
            {change.movedFrom !== null && (
              <span className="truncate text-muted-foreground-3">
                from {change.movedFrom}
              </span>
            )}
          </span>
          <span className="shrink-0 text-muted-foreground-3">
            {change.movedFrom === null ? changeLabels[change.change] : "Moved"}
          </span>
          {onPurge === undefined ? null : change.change === "deleted" ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Purge name"
                    onClick={() => onPurge(change.path)}
                  >
                    <Icon name="eraser" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Purge name</TooltipContent>
            </Tooltip>
          ) : (
            <span className="size-(--h-control-xs) shrink-0" />
          )}
        </div>
      ))}
      {changes.length > shown.length && (
        <Button
          variant="ghost"
          size="xs"
          className="mt-0.5 self-start"
          onClick={() => setPages(pages + 1)}
        >
          {`Show ${Math.min(changePageSize, changes.length - shown.length)} more`}
        </Button>
      )}
    </div>
  );
}

export interface PurgeNameDialogProps {
  readonly path: string | undefined;
  /** The drive kept versions from before row storage. */
  readonly preConversion: boolean;
  readonly purging: boolean;
  readonly refusal: PurgeRefusal | undefined;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export function PurgeNameDialog({
  path,
  preConversion,
  purging,
  refusal,
  onOpenChange,
  onConfirm,
}: PurgeNameDialogProps) {
  return (
    <Dialog
      open={path !== undefined}
      onOpenChange={(open) => !purging && onOpenChange(open)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {refusal === undefined
              ? "Purge deleted name"
              : "Can't purge this name"}
          </DialogTitle>
          <DialogDescription className="break-all">{path}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {refusal === undefined ? (
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground-1">
              <li>
                Removes the name from this drive's row history permanently
              </li>
              {preConversion && (
                <li>
                  Versions saved before this drive moved to row storage keep the
                  name until they expire
                </li>
              )}
              <li>
                Raises the drive's tombstone floor, so replicas behind it
                remount cold
              </li>
              <li className="text-foreground">
                No undo, a purge has no inverse by design
              </li>
            </ul>
          ) : refusal.reason === "held" ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground-1">
                Still held by
              </span>
              <ul className="flex flex-col gap-1.5">
                {groupHolds(refusal.holds).map((hold) => (
                  <li
                    key={hold.kind}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="w-16 shrink-0 font-medium text-foreground">
                      {holdCopy[hold.kind].word}
                    </span>
                    <span className="min-w-0 flex-1 text-muted-foreground-1">
                      {holdCopy[hold.kind].detail}
                    </span>
                    {hold.seqs.length > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground-3 tabular-nums">
                        {holdSeqLabel(hold.seqs)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground-1">
              {refusal.reason === "absent"
                ? "No deleted name at this path"
                : "This drive's format can't purge names yet"}
            </span>
          )}
        </DialogBody>
        <DialogFooter>
          {refusal === undefined ? (
            <>
              <Button
                variant="ghost"
                disabled={purging}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button intent="danger" disabled={purging} onClick={onConfirm}>
                Purge name
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
