import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { memo, type ReactNode } from "react";
import { toast } from "sonner";
import {
  formatAgoMinified,
  overviewRow,
  overviewRowIcon,
  overviewRowInteractive,
  overviewRowLine,
  overviewRowMeta,
  overviewRowMuted,
  overviewRowTitle,
} from "@/components/captain-overview";
import { ContextMenu, ContextMenuTrigger } from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import {
  type CrewThread,
  crewRemovedDescription,
  leaveCrewAtom,
} from "./captain-data";
import { CrewAction } from "./crew-action";

const statusTone: Record<CrewThread["status"], string> = {
  working: "text-progress",
  waiting: "text-info",
  idle: "",
};

export type CrewThreadRowProps = {
  orgId?: string;
  captainJamId: string;
  captainName?: string;
  thread: CrewThread;
  hovered?: boolean;
  active?: boolean;
  now: Date;
  onOpen: (threadId: string) => void;
  onMessage?: (thread: CrewThread) => void;
  onArchive?: (thread: CrewThread) => void;
  preview?: (thread: CrewThread) => ReactNode;
  menu?: (thread: CrewThread) => ReactNode;
};

/** One crew thread in a Captain's overview, with hover actions. */
export const CrewThreadRow = memo(function CrewThreadRow({
  orgId,
  captainJamId,
  captainName,
  thread,
  hovered = false,
  active = false,
  now,
  onOpen,
  onMessage,
  onArchive,
  preview,
  menu,
}: CrewThreadRowProps) {
  const navigate = useNavigate();
  const leaveCrew = useAtomSet(leaveCrewAtom, { mode: "promise" });
  const title = thread.title ?? "Untitled thread";
  const pull = thread.pulls[0];
  const emphasis = thread.unread || active;

  const remove = () => {
    if (orgId === undefined) return;
    leaveCrew({
      params: { orgId, jamId: captainJamId, threadId: thread.id },
      reactivityKeys: [
        `jam:${orgId}`,
        `jam:${thread.id}`,
        `captain:${captainJamId}`,
        `jam_relation:${captainJamId}`,
      ],
    })
      .then(() =>
        toast.success("Removed from crew", {
          description: crewRemovedDescription(title, captainName),
        }),
      )
      .catch(() =>
        toast.error("Could not remove from crew", { description: title }),
      );
  };

  const body = (
    <div
      data-slot="captain-crew-row"
      className={cx(
        "group/thread relative",
        (hovered || active) && "[&>button]:bg-secondary",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(thread.id)}
        aria-current={active ? "true" : undefined}
        className={cx(overviewRow, overviewRowInteractive, "select-none")}
      >
        <span className={overviewRowLine}>
          <span className={overviewRowIcon}>
            <Icon
              name="cloud-simple"
              size="sm"
              data-status={thread.status}
              className={cx(
                emphasis ? "text-foreground" : overviewRowMuted,
                statusTone[thread.status],
              )}
            />
          </span>
          <span
            className={cx(
              overviewRowTitle,
              thread.unread
                ? "font-semibold text-foreground"
                : active
                  ? "font-normal text-foreground"
                  : cx("font-normal", overviewRowMuted),
            )}
          >
            {title}
          </span>
          {thread.needsYou && (
            <span
              role="img"
              aria-label="Needs you"
              className="size-1.5 shrink-0 rounded-full bg-progress"
            />
          )}
        </span>
        <span
          className={cx(
            overviewRowMeta,
            "mask-fade-r overflow-hidden whitespace-nowrap",
          )}
        >
          {thread.modelName !== null && (
            <>
              <span className="shrink-0">{thread.modelName}</span>
              <span aria-hidden>·</span>
            </>
          )}
          {thread.code !== null && (
            <>
              <span className="shrink-0">{thread.code}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="shrink-0">
            {formatAgoMinified(thread.lastActivityAt ?? thread.updatedAt, now)}
          </span>
          {pull !== undefined && (
            <>
              <span aria-hidden>·</span>
              <span className="flex shrink-0 items-center gap-1">
                <Icon name="git" size="xs" data-state={pull.state} />
                {thread.pullCount === 1
                  ? `#${pull.number}`
                  : `${thread.pullCount} PRs`}
              </span>
            </>
          )}
        </span>
      </button>
      <span
        className={cx(
          "mask-fade-l [--mask-fade-ramp:--spacing(8)] absolute inset-y-0 right-0 flex items-start rounded-r pt-1 pr-1 pl-9",
          "pointer-events-none opacity-0 transition-opacity duration-100 group-hover/thread:pointer-events-auto group-hover/thread:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
          hovered && "pointer-events-auto opacity-100",
        )}
      >
        <span aria-hidden className="absolute inset-0 rounded-r bg-panel" />
        <span aria-hidden className="absolute inset-0 rounded-r bg-secondary" />
        <span className="relative flex items-center">
          <CrewAction
            label="Open as its own thread"
            onClick={() =>
              void navigate({
                to: "/thread/$threadId",
                params: { threadId: thread.id },
              })
            }
          >
            <Icon name="arrow-corner-up-right" size="sm" />
          </CrewAction>
          {onMessage !== undefined && (
            <CrewAction
              label="Message thread"
              onClick={() => onMessage(thread)}
            >
              <Icon name="bubble-text" size="sm" />
            </CrewAction>
          )}
          <CrewAction label="Remove from crew" onClick={remove}>
            <Icon name="user-remove" size="sm" />
          </CrewAction>
          {onArchive !== undefined && (
            <CrewAction
              label="Archive thread"
              onClick={() => onArchive(thread)}
            >
              <Icon name="mailbox" size="sm" />
            </CrewAction>
          )}
        </span>
      </span>
    </div>
  );

  const card = preview?.(thread);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">
        {card == null ? (
          body
        ) : (
          <PreviewCard>
            <PreviewCardTrigger render={body} />
            <PreviewCardContent side="left" align="start" className="w-96">
              {card}
            </PreviewCardContent>
          </PreviewCard>
        )}
      </ContextMenuTrigger>
      {menu?.(thread)}
    </ContextMenu>
  );
});
