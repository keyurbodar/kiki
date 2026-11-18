import { useAtomValue } from "@effect/atom-react";
import { Option, Result, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { messageVersionsAtom } from "@/data/atoms/events";
import { idleAtom } from "@/data/atoms/idle";
import {
  type EventId,
  type MessageVersion,
  MessageVersionsWithBranches,
  type UserMessageRow as UserMessageRowSchema,
} from "@/data/events";
import { useMessageActions } from "@/features/thread/message-footer";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const idleVersions = idleAtom<unknown>();

const decodeVersions = Schema.decodeUnknownResult(MessageVersionsWithBranches);

export type VersionSwitcherControlsProps = {
  versions: ReadonlyArray<MessageVersion>;
  /** The event on screen: the version the switcher reads its position from. */
  eventId: EventId;
  root: EventId;
  onView?: (version: MessageVersion, root: EventId) => void;
};

/**
 * Capy's version switcher: a previous/next pair around the version on screen,
 * as `2/3`. A message with one version, or one the reader cannot switch, shows
 * nothing.
 */
export function VersionSwitcherControls({
  versions,
  eventId,
  root,
  onView,
}: VersionSwitcherControlsProps) {
  if (versions.length < 2) return null;
  const found = versions.findIndex((version) => version.id === eventId);
  const index =
    found === -1 ? versions.findIndex((version) => version.live) : found;
  const prev = versions[index - 1];
  const next = versions[index + 1];
  const view = (version: MessageVersion) => onView?.(version, root);
  return (
    <span className="kiki-inline text-xs text-muted-foreground-2 tabular-nums">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Previous version"
        disabled={prev === undefined || onView === undefined}
        onClick={() => prev !== undefined && view(prev)}
      >
        <Icon name="chevron-left-small" />
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={<span>{`${index + 1}/${versions.length}`}</span>}
        />
        <TooltipContent>
          {`Version ${index + 1} of ${versions.length}`}
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Next version"
        disabled={next === undefined || onView === undefined}
        onClick={() => next !== undefined && view(next)}
      >
        <Icon name="chevron-right-small" />
      </Button>
    </span>
  );
}

export type VersionSwitcherProps = {
  row: Pick<typeof UserMessageRowSchema.Type, "eventId" | "versionRoot">;
};

/**
 * The switcher for one message row: reads the versions of the row's root and
 * hands the pick to the thread, which shows that version's text.
 */
export function VersionSwitcher({ row }: VersionSwitcherProps) {
  const { orgId, jamId, viewVersion } = useMessageActions();
  const root = row.versionRoot ?? row.eventId;
  const result = useAtomValue(
    orgId === undefined || jamId === undefined
      ? idleVersions
      : messageVersionsAtom(orgId, jamId, root),
  );
  const decoded = useMemo(() => {
    const body = Option.getOrUndefined(AsyncResult.value(result));
    if (body === undefined) return undefined;
    return Result.getOrUndefined(decodeVersions(body));
  }, [result]);
  if (decoded === undefined) return null;
  return (
    <VersionSwitcherControls
      versions={decoded.versions}
      eventId={row.eventId}
      root={decoded.root}
      onView={viewVersion}
    />
  );
}
