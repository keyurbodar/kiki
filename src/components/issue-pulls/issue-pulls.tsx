import { Link, useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { IssuePullRef } from "@/data/api/schemas/issue";
import { Badge } from "@/primitives/badge";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import {
  groupPullStates,
  type IssuePullDisplayState,
  IssuePullStateCounts,
  IssuePullStateIcon,
  pullDisplayState,
} from "./pull-state";

export type OpenIssuePull = (pull: {
  repo: string;
  number: number;
  url: string;
}) => void;

/** The repo name without its owner, as PR chips print it. */
export const pullRepoName = (repoFullName: string) =>
  repoFullName.split("/")[1] ?? repoFullName;

/** Route params for a pull, splitting `owner/repo`. */
export const pullRouteParams = (repoFullName: string, prNumber: number) => {
  const [owner = "", repo = repoFullName] = repoFullName.split("/");
  return { owner, repo, prNumber: String(prNumber) };
};

export type IssuePullChipsProps = {
  pulls: ReadonlyArray<IssuePullRef>;
  /** Opens a pull in place (the thread pane); without it the chip navigates to the pull page. */
  onOpenPull?: OpenIssuePull;
  /** The checks state of an open PR, when known. */
  checks?: (pull: IssuePullRef) => IssuePullDisplayState | undefined;
};

/**
 * A list row's linked pull requests: one PR shows its state and number and
 * opens on click; several show counts per state. Hovering lists them all.
 */
export function IssuePullChips({
  pulls,
  onOpenPull,
  checks,
}: IssuePullChipsProps) {
  const navigate = useNavigate();
  const first = pulls[0];
  if (first === undefined) return null;
  const stateOf = (pull: IssuePullRef) =>
    pullDisplayState(pull, checks?.(pull));
  const open = (pull: IssuePullRef) => {
    if (onOpenPull === undefined) {
      void navigate({
        to: "/pull/$owner/$repo/$prNumber",
        params: pullRouteParams(pull.repoFullName, pull.prNumber),
      });
      return;
    }
    onOpenPull({
      repo: pull.repoFullName,
      number: pull.prNumber,
      url: `https://github.com/${pull.repoFullName}/pull/${pull.prNumber}`,
    });
  };
  return (
    <PreviewCard>
      <PreviewCardTrigger
        render={
          pulls.length === 1 ? (
            <Badge
              size="xs"
              className="shrink-0"
              aria-label={`Open ${pullRepoName(first.repoFullName)}#${first.prNumber}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                open(first);
              }}
            />
          ) : (
            <Badge size="xs" className="shrink-0" />
          )
        }
      >
        {pulls.length === 1 ? (
          <>
            <IssuePullStateIcon state={stateOf(first)} />
            <span className="tabular-nums">#{first.prNumber}</span>
          </>
        ) : (
          <IssuePullStateCounts
            groups={groupPullStates(
              pulls.map((pull) => ({ state: stateOf(pull) })),
            )}
          />
        )}
      </PreviewCardTrigger>
      <PreviewCardContent
        side="bottom"
        align="end"
        sideOffset={6}
        className="w-80"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="-m-1.5 flex max-h-80 min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain p-0.5 md:scroll-fade-y">
          {pulls.map((pull) => (
            <Link
              key={`${pull.repoFullName}#${pull.prNumber}`}
              to="/pull/$owner/$repo/$prNumber"
              params={pullRouteParams(pull.repoFullName, pull.prNumber)}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                open(pull);
              }}
              className={cx(
                "flex items-center gap-2 rounded px-1.5 py-1 outline-none select-none",
                "hover:bg-popover-hover focus-visible:outline-ring-inset",
              )}
            >
              <IssuePullStateIcon state={stateOf(pull)} />
              <span className="shrink-0 text-xs font-normal text-muted-foreground-2 tabular-nums">
                {pullRepoName(pull.repoFullName)}#{pull.prNumber}
              </span>
              <span className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
                {pull.title}
              </span>
            </Link>
          ))}
        </div>
      </PreviewCardContent>
    </PreviewCard>
  );
}
