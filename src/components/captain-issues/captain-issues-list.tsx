import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { useMemo } from "react";
import type { IssueState, IssueSummary } from "@/data/api/schemas/issue";
import {
  allIssuesAtom,
  captainIssueActivityAtom,
  issueStatesAtom,
} from "@/data/atoms/issues";
import { projectsAtom } from "@/data/atoms/projects";
import {
  useCurrentUserId,
  useOrgId,
} from "@/features/captains/dialogs/session";
import { IssuesList } from "../issues-list";
import { captainIssueDisplayAtom } from "./atoms";
import type { CaptainIssuesListProps } from "./captain-issues";

type Unknown = AsyncResult.AsyncResult<unknown, unknown>;

/** Reads that hold still until the session names an org. */
const idle: Atom.Atom<Unknown> = Atom.make(AsyncResult.initial(false));

type IssueListValue = { readonly issues: ReadonlyArray<IssueSummary> };
type IssueStateValue = { readonly states: ReadonlyArray<IssueState> };

const listOf = (value: unknown): ReadonlyArray<IssueSummary> =>
  (value as IssueListValue | undefined)?.issues ?? [];

/** The crew's issue refs as the activity endpoint returns them. */
const crewIssueRefs = (value: unknown) => {
  const items = (value as { items?: unknown } | undefined)?.items;
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const item of Array.isArray(items) ? items : []) {
    const { id, code } = (item ?? {}) as { id?: unknown; code?: unknown };
    if (typeof id === "string") ids.add(id);
    if (typeof code === "string") codes.add(code);
  }
  return { ids, codes };
};

const assignedTo = (issue: IssueSummary, userId: string) =>
  issue.assignee?.id === userId ||
  (issue.assignees ?? []).some((actor) => actor.id === userId);

/**
 * The crew issues pane's list: the crew's issues, filtered by the pane's view
 * and search, drawn by the shared issues list at pane density.
 */
export function CaptainIssuesList({
  scope,
  stateIds,
  stateNot,
  hideClosedSubIssues,
  now,
  emptyText,
  assigneeMe = false,
  mentioned = false,
  search = "",
  onOpenIssue,
}: CaptainIssuesListProps) {
  const orgId = useOrgId();
  const userId = useCurrentUserId();
  const display = useAtomValue(captainIssueDisplayAtom(scope));
  const activityAtom: Atom.Atom<Unknown> =
    orgId === undefined ? idle : captainIssueActivityAtom(orgId, scope);
  const issuesAtom: Atom.Atom<Unknown> =
    orgId === undefined ? idle : allIssuesAtom(orgId);
  const statesAtom: Atom.Atom<Unknown> =
    orgId === undefined ? idle : issueStatesAtom(orgId);
  const projectsAtomFor: Atom.Atom<Unknown> =
    orgId === undefined ? idle : projectsAtom(orgId);
  const activity = useAtomValue(activityAtom);
  const allIssues = useAtomValue(issuesAtom);
  const states = useAtomValue(statesAtom);
  const projects = useAtomValue(projectsAtomFor);

  const issues = useMemo(() => {
    if (!AsyncResult.isSuccess(activity) || !AsyncResult.isSuccess(allIssues))
      return undefined;
    const { ids, codes } = crewIssueRefs(activity.value);
    const term = search.trim().toLowerCase();
    return listOf(allIssues.value).filter((issue) => {
      if (!ids.has(issue.id) && !codes.has(issue.code)) return false;
      if (assigneeMe && (userId === undefined || !assignedTo(issue, userId)))
        return false;
      if (mentioned && issue.viewer.mentions === 0) return false;
      return term === "" || issue.title.toLowerCase().includes(term);
    });
  }, [activity, allIssues, assigneeMe, mentioned, search, userId]);

  const projectNames = useMemo(() => {
    if (!AsyncResult.isSuccess(projects)) return {};
    const rows = projects.value as {
      readonly projects?: ReadonlyArray<{ id: string; name: string }>;
    };
    return Object.fromEntries(
      (rows.projects ?? []).map((project) => [project.id, project.name]),
    );
  }, [projects]);

  if (orgId === undefined) return null;

  return (
    <IssuesList
      orgId={orgId}
      issues={issues}
      states={
        AsyncResult.isSuccess(states)
          ? (states.value as IssueStateValue).states
          : undefined
      }
      filters={{ stateIds, stateNot, hideClosedSubIssues }}
      display={display}
      projectNames={projectNames}
      now={now}
      emptyText={emptyText}
      density="pane"
      onOpenIssue={onOpenIssue}
      failed={AsyncResult.isFailure(activity)}
    />
  );
}
