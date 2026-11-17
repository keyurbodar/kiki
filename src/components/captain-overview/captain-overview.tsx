import { cx } from "class-variance-authority";
import { DateTime } from "effect";
import type { MouseEvent, ReactNode } from "react";
import type {
  IssueActor,
  IssuePriority,
  IssueSummary,
} from "@/data/api/schemas/issue";
import { ContextMenu, ContextMenuTrigger } from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import {
  OverviewSection,
  type OverviewSectionMore,
  overviewRow,
  overviewRowIcon,
  overviewRowInteractive,
  overviewRowLine,
  overviewRowMeta,
  overviewRowTitle,
} from "./overview-section";
import { formatAgoMinified } from "./relative-time";

export type CaptainIssueThread = {
  id: string;
  lastActivityAt?: Date | null;
  updatedAt: Date;
};

const byUpdatedDesc = (a: IssueSummary, b: IssueSummary) =>
  DateTime.toEpochMillis(b.updatedAt) - DateTime.toEpochMillis(a.updatedAt);

/**
 * Splits a Captain's open issues the way Capy's overview does: assigned to a
 * person needs you, assigned to a thread is in progress. Issues in a state
 * that isn't open are dropped.
 */
export function partitionCaptainIssues(
  issues: readonly IssueSummary[],
  openStateIds: readonly string[],
) {
  const open = issues.filter((issue) => openStateIds.includes(issue.stateId));
  return {
    needsYou: open
      .filter((issue) => issue.assignee?.kind === "user")
      .toSorted(byUpdatedDesc),
    inProgress: open
      .filter((issue) => issue.assignee?.kind === "jam")
      .toSorted(byUpdatedDesc),
  };
}

const priorityIcons: Partial<Record<IssuePriority, ReactNode>> = {
  urgent: (
    <Icon
      name="exclamation-circle"
      size="xs"
      className="text-destructive"
      label="Urgent"
    />
  ),
};

function ActorMark({ actor }: { actor: IssueActor }) {
  if (actor.avatarUrl !== null) {
    return (
      <img
        src={actor.avatarUrl}
        alt=""
        draggable={false}
        className="size-3 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid size-3 shrink-0 place-items-center rounded-full bg-secondary text-2xs leading-none">
      {actor.name.slice(0, 1)}
    </span>
  );
}

export type CaptainIssuesOverviewProps = {
  jamId: string;
  issues: readonly IssueSummary[];
  openStateIds: readonly string[];
  crew?: readonly CaptainIssueThread[];
  now: Date;
  more?: OverviewSectionMore;
  onOpenIssue: (code: string, newTab: boolean) => void;
  stateIcon?: (issue: IssueSummary) => ReactNode;
  menu?: (issue: IssueSummary) => ReactNode;
};

/**
 * The issue blocks of a Captain's overview (Capy's
 * shared/issues/captain-overview): "Needs you" for issues waiting on a
 * person, "In progress" for issues a crew thread is working.
 */
export function CaptainIssuesOverview({
  jamId,
  issues,
  openStateIds,
  crew = [],
  now,
  more,
  onOpenIssue,
  stateIcon,
  menu,
}: CaptainIssuesOverviewProps) {
  if (openStateIds.length === 0) return null;
  const { needsYou, inProgress } = partitionCaptainIssues(issues, openStateIds);

  const row = (issue: IssueSummary, meta: ReactNode) => (
    <ContextMenu key={issue.id}>
      <ContextMenuTrigger className="block">
        <button
          type="button"
          data-slot="captain-overview-issue"
          onClick={(event: MouseEvent) =>
            onOpenIssue(issue.code, event.metaKey || event.ctrlKey)
          }
          className={cx(overviewRow, overviewRowInteractive, "select-none")}
        >
          <span className={overviewRowLine}>
            <span className={overviewRowIcon}>{stateIcon?.(issue)}</span>
            <span
              className={cx(
                overviewRowTitle,
                issue.viewer.subscribed && issue.viewer.unread
                  ? "font-semibold text-foreground"
                  : "font-normal text-foreground",
              )}
            >
              {issue.title}
            </span>
            {priorityIcons[issue.priority]}
          </span>
          <span
            className={cx(
              overviewRowMeta,
              "mask-fade-r overflow-hidden whitespace-nowrap",
            )}
          >
            <span className="shrink-0">{issue.code}</span>
            {meta}
          </span>
        </button>
      </ContextMenuTrigger>
      {menu?.(issue)}
    </ContextMenu>
  );

  return (
    <>
      {needsYou.length > 0 && (
        <OverviewSection
          jamId={jamId}
          sectionId="issues_needs_you"
          label="Needs you"
          count={String(needsYou.length)}
          more={more}
          rows={needsYou.map((issue) =>
            row(
              issue,
              issue.assignee !== null && (
                <>
                  <span className="shrink-0">for</span>
                  <ActorMark actor={issue.assignee} />
                  <span className="truncate">{issue.assignee.name}</span>
                  <span className="ml-auto shrink-0 pl-2">
                    {formatAgoMinified(DateTime.toDate(issue.updatedAt), now)}
                  </span>
                </>
              ),
            ),
          )}
        />
      )}
      {(inProgress.length > 0 || more !== undefined) && (
        <OverviewSection
          jamId={jamId}
          sectionId="issues_in_progress"
          label="In progress"
          count={String(inProgress.length)}
          more={more}
          rows={inProgress.map((issue) => {
            const thread = crew.find((t) => t.id === issue.assignee?.id);
            return row(
              issue,
              issue.assignee !== null && (
                <>
                  <span className="shrink-0">with</span>
                  <ActorMark actor={issue.assignee} />
                  <span className="truncate">{issue.assignee.name}</span>
                  {thread !== undefined && (
                    <span className="ml-auto shrink-0 pl-2">
                      {formatAgoMinified(
                        thread.lastActivityAt ?? thread.updatedAt,
                        now,
                      )}
                    </span>
                  )}
                </>
              ),
            );
          })}
        />
      )}
    </>
  );
}
