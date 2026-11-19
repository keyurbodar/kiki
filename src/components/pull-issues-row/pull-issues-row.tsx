import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult, Atom } from "effect/reactivity";
import type { MouseEvent } from "react";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import {
  IssuePropertyRow,
  IssueStateIcon,
  issueStatusDefaults,
  useIssueOrgId,
} from "@/features/issues/issue-parts";
import { useIssueStates } from "@/features/issues/issue-pickers";
import { Icon } from "@/primitives/icon";
import { openIssueInPlace } from "./open-issue";

const pullIssuesQuery = Atom.family((key: string) => {
  const slash = key.indexOf("/");
  const orgId = key.slice(0, slash);
  const pullId = key.slice(slash + 1);
  return ApiClient.query("issues", "byPull", {
    params: { orgId, pullId },
    reactivityKeys: [
      `pull-issues:${orgId}/${pullId}`,
      reactivityKeys.issues(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

/** The issues row a pull reads while its org is still resolving. */
const idlePullIssues = Atom.make(AsyncResult.initial(false)) as ReturnType<
  typeof pullIssuesQuery
>;

const issueLinkClassName = [
  "-mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium text-foreground",
  "outline-none select-none transition-colors duration-100 hover:bg-secondary data-[popup-open]:bg-secondary",
  "focus-visible:outline-ring-inset max-w-full min-w-0",
].join(" ");

export type PullIssuesRowProps = {
  pullId: string;
  /** Opens an issue in place; a plain click then stays on the pull instead of navigating. */
  onOpenIssue?: (code: string) => void;
};

/** Capy's PullIssuesRow: the pull view's "Issue(s)" property row listing the issues the pull closes. */
export function PullIssuesRow({ pullId, onOpenIssue }: PullIssuesRowProps) {
  const orgId = useIssueOrgId();
  const states = useIssueStates(orgId);
  const result = useAtomValue(
    orgId === undefined
      ? idlePullIssues
      : pullIssuesQuery(`${orgId}/${pullId}`),
  );
  if (orgId === undefined || !AsyncResult.isSuccess(result)) return null;
  const issues = result.value;
  return (
    <IssuePropertyRow
      icon={<Icon name="circle-dashed" />}
      label={issues.length > 1 ? "Issues" : "Issue"}
    >
      {issues.length === 0 ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground-2">
          No issues
        </span>
      ) : (
        <span className="flex w-full min-w-0 flex-col items-start gap-0.5">
          {issues.map((issue) => {
            const look =
              states.find((state) => state.id === issue.stateId) ??
              issueStatusDefaults[issue.status];
            return (
              <Link
                key={issue.id}
                data-track-owner="shared/issues/pull-issues-row.tsx#PullIssuesRow:Link.1"
                to="/issues/$code"
                params={{ code: issue.code }}
                className={issueLinkClassName}
                onClick={(event: MouseEvent) =>
                  openIssueInPlace(event, onOpenIssue, issue.code)
                }
              >
                <span className="flex size-(--icon-xs) shrink-0 items-center justify-center">
                  <IssueStateIcon
                    icon={look.icon}
                    color={look.color}
                    className="size-(--icon-xs)"
                  />
                </span>
                <span className="shrink-0 font-normal text-muted-foreground-2">
                  {issue.code}
                </span>
                <span className="min-w-0 truncate">{issue.title}</span>
              </Link>
            );
          })}
        </span>
      )}
    </IssuePropertyRow>
  );
}
