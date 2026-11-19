import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDownSmall,
  ChevronRightSmall,
  IssueActorAvatar,
  issueCoarseHitArea,
  issueDate,
  relativeTime,
} from "@/components/issue-parts";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  type IssueDetail,
  type IssueSummary,
  isClosedIssueStatus,
} from "@/data/api/schemas/issue";
import { markIssueSeenAtom } from "@/data/atoms/issues";
import { Button } from "@/primitives/button";
import { IssueActivity } from "./activity";
import { useIssueViewContext } from "./context";
import { Description } from "./description";
import { IssueStatusGlyph, PropertyRows } from "./property-rows";
import { issueKeys, useIssueActions, useIssueDetail } from "./use-issue";

const metaPart = "relative flex shrink-0 items-center gap-1.5 pl-4";
const metaRule =
  "absolute top-1/2 left-2 h-3 w-hairline shrink-0 -translate-y-1/2 bg-border-1";

/** Title, then code and age (Capy's IssueHeading). */
export function IssueHeading({ detail }: { detail: IssueDetail }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-xl font-medium text-balance text-foreground">
        {detail.issue.title}
      </h1>
      <div className="overflow-hidden">
        <div className="-ml-4 flex min-w-0 flex-wrap items-center gap-y-1 text-xs text-muted-foreground-2">
          <span className={metaPart}>
            <span aria-hidden className={metaRule} />
            <span>{detail.issue.code}</span>
          </span>
          <span className={metaPart}>
            <span aria-hidden className={metaRule} />
            <span>{relativeTime(issueDate(detail.issue.createdAt))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Sub-issues with their closed count; done ones fold away (Capy's SubIssuesSection). */
export function SubIssuesSection({
  orgId,
  issues,
  closed,
}: {
  orgId: OrgId | undefined;
  issues: ReadonlyArray<IssueSummary>;
  closed: number;
}) {
  const { openIssue } = useIssueViewContext();
  const [open, setOpen] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const done = issues.filter((issue) => isClosedIssueStatus(issue.status));
  const row = (issue: IssueSummary) => (
    <Link
      key={issue.id}
      to="/issues/$code"
      params={{ code: issue.code }}
      onClick={(event) => {
        if (openIssue === undefined || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        openIssue(issue.code);
      }}
      className={cx(
        "flex h-7 items-center gap-2 rounded px-2 transition-colors duration-100",
        "outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset",
      )}
    >
      <IssueStatusGlyph
        orgId={orgId}
        issue={issue}
        className="size-(--icon-xs)"
      />
      <span className="shrink-0 text-xs text-muted-foreground-2">
        {issue.code}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span className="min-w-0 truncate text-xs text-foreground">
          {issue.title}
        </span>
      </span>
      {issue.assignee === null ? (
        <span className="shrink-0 text-xs text-muted-foreground-3">
          No assignee
        </span>
      ) : (
        <span className="flex min-w-0 max-w-40 shrink-0 items-center gap-1.5 text-xs text-muted-foreground-2">
          <IssueActorAvatar actor={issue.assignee} className="size-3.5" />
          <span className="truncate">
            {issue.assignee.code ?? issue.assignee.name}
          </span>
        </span>
      )}
    </Link>
  );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          className="-ml-2"
          onClick={() => setOpen(!open)}
        >
          <span className="text-muted-foreground-2">Sub-issues</span>
          {open ? (
            <ChevronDownSmall className="text-icon-muted" />
          ) : (
            <ChevronRightSmall className="text-icon-muted" />
          )}
        </Button>
        <span className="ml-auto min-w-0 truncate text-xs text-muted-foreground-3 tabular-nums">
          {closed}/{issues.length} closed
        </span>
      </div>
      {open && (
        <div className="-mx-2 flex flex-col">
          {issues.filter((issue) => !done.includes(issue)).map(row)}
          {done.length > 0 && (
            <button
              type="button"
              aria-expanded={showDone}
              className={cx(
                "relative flex h-7 cursor-pointer items-center gap-2 rounded px-2 text-xs text-muted-foreground-2 transition-colors duration-100",
                issueCoarseHitArea,
                "outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset",
              )}
              onClick={() => setShowDone(!showDone)}
            >
              <ChevronDownSmall
                className={cx(
                  "size-(--icon-xs) text-icon-muted transition-transform duration-100",
                  !showDone && "-rotate-90",
                )}
              />
              <span className="tabular-nums">{done.length} done</span>
            </button>
          )}
          {showDone && done.map(row)}
        </div>
      )}
    </div>
  );
}

function IssueViewBody({
  orgId,
  detail,
}: {
  orgId: OrgId;
  detail: IssueDetail;
}) {
  const actions = useIssueActions(detail, orgId);
  const [quote, setQuote] = useState<IssueQuote | null>(null);
  return (
    <div
      data-slot="issue-view"
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-2 pb-4"
    >
      <IssueHeading detail={detail} />
      <PropertyRows orgId={orgId} detail={detail} actions={actions} />
      <Description
        detail={detail}
        actions={actions}
        onQuote={(text) => setQuote({ text, nonce: Date.now() })}
      />
      {detail.subIssues.length > 0 && (
        <SubIssuesSection
          orgId={orgId}
          issues={detail.subIssues}
          closed={detail.issue.closedSubIssueCount}
        />
      )}
      <IssueActivity
        orgId={orgId}
        detail={detail}
        actions={actions}
        quote={quote}
      />
    </div>
  );
}

/** A selected description passage the comment box is seeded with. */
export type IssueQuote = { text: string; nonce: number };

/** Marks an unread issue seen once the viewer has it open. */
function useMarkSeen(
  orgId: OrgId | undefined,
  detail: IssueDetail | undefined,
) {
  const markSeen = useAtomSet(markIssueSeenAtom, { mode: "promise" });
  const marked = useRef<string | null>(null);
  const viewer = detail?.issue.viewer;
  const key =
    detail === undefined ||
    viewer === undefined ||
    (!viewer.unread && viewer.mentions === 0)
      ? null
      : `${detail.issue.id}:${viewer.mentions}`;
  const code = detail?.issue.code;
  useEffect(() => {
    if (orgId === undefined || key === null || code === undefined) return;
    if (marked.current === key) return;
    marked.current = key;
    markSeen({
      params: { orgId, code },
      reactivityKeys: issueKeys(orgId, code),
    }).catch(() => undefined);
  }, [orgId, key, code, markSeen]);
}

/** One issue: heading, properties, description, sub-issues, activity (Capy's IssueView). */
export function IssueView({ code }: { code: string }) {
  const { orgId, detail } = useIssueDetail(code);
  useMarkSeen(orgId, detail);
  if (orgId === undefined || detail === undefined) return null;
  return <IssueViewBody orgId={orgId} detail={detail} />;
}
