import { AsyncResult, Atom } from "effect/reactivity";
import type { IssueSummary } from "@/data/api/schemas/issue";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import type { CrewThread } from "@/features/captains/overview/captain-data";
import type { OverviewTask } from "@/features/thread-panes/overview/model";
import { formatAge } from "@/features/threads/threads-page/model";

type Json = Record<string, unknown>;

const record = (value: unknown): Json =>
  typeof value === "object" && value !== null ? (value as Json) : {};

const text = (value: unknown) => (typeof value === "string" ? value : "");

const key = (orgId: string, jamId: string) => `${orgId}/${jamId}`;
const splitKey = (value: string) => {
  const slash = value.indexOf("/");
  return {
    orgId: value.slice(0, slash),
    jamId: value.slice(slash + 1),
  };
};

/**
 * The issues a Captain's crew is working on. The endpoint and its mock handler
 * exist for exactly this section, but no atom wrapped it; the query lives here,
 * beside the pane that reads it, the way the Captain overview keeps its own.
 */
const activityQuery = Atom.family((value: string) => {
  const { orgId, jamId } = splitKey(value);
  return ApiClient.query("issues", "captainActivity", {
    params: { orgId, jamId },
    reactivityKeys: [`captain:${jamId}`, reactivityKeys.issues(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const captainIssueActivityAtom = (orgId: string, jamId: string) =>
  activityQuery(key(orgId, jamId));

/** The Captain's issue activity while the org is still resolving. */
export const idleCaptainIssueActivityAtom: ReturnType<
  typeof captainIssueActivityAtom
> = Atom.make(AsyncResult.initial(false)) as ReturnType<
  typeof captainIssueActivityAtom
>;

/** One issue of the "In progress" section: the issue and the thread working it. */
export type InProgressIssue = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  /** The assignee's thread code when a thread owns it, its name for a person. */
  readonly assignee: string | null;
};

const actorLabel = (actor: IssueSummary["assignee"]) =>
  actor === null ? null : (actor.code ?? actor.name);

/**
 * The crew's in-progress issues: the Captain's activity names every issue its
 * crew touched, and the issue list carries the title and assignee the rows
 * print. An issue that is not `in_progress` belongs to another section.
 */
export function inProgressIssues(
  activity: unknown,
  issues: ReadonlyArray<IssueSummary>,
): ReadonlyArray<InProgressIssue> {
  const items = record(activity).items;
  if (!Array.isArray(items)) return [];
  const byCode = new Map(issues.map((issue) => [issue.code, issue]));
  return items.flatMap((row) => {
    const item = record(row);
    const code = text(item.code);
    const issue = byCode.get(code);
    if (issue === undefined || issue.status !== "in_progress") return [];
    return [
      {
        id: text(item.id) || code,
        code,
        title: issue.title,
        assignee: actorLabel(issue.assignee),
      },
    ];
  });
}

/**
 * "DOCK-5 · 4h · 2 PRs", and "DOCK-2 · 10h" when the thread has no pull. A
 * payload with no activity stamp (an epoch date) has no age to print.
 */
export function crewMeta(thread: CrewThread, now: number): string {
  const stamp = thread.lastActivityAt ?? thread.updatedAt;
  const age =
    stamp.getTime() === 0
      ? undefined
      : formatAge(stamp, { now, minified: true });
  const pulls =
    thread.pullCount === 0
      ? undefined
      : `${thread.pullCount} ${thread.pullCount === 1 ? "PR" : "PRs"}`;
  return [thread.code ?? undefined, age, pulls]
    .filter((part) => part !== undefined)
    .join(" · ");
}

/** "AMA-177 with DOCK-3": the issue, then whoever holds it. */
export const issueMeta = (issue: InProgressIssue): string =>
  issue.assignee === null ? issue.code : `${issue.code} with ${issue.assignee}`;

/** "Subagent 2 · 4h". */
export const subagentMeta = (
  task: OverviewTask,
  index: number,
  now: number,
): string =>
  `Subagent ${task.localIndex ?? index + 1} · ${formatAge(task.lastActivityAt ?? task.createdAt, { now, minified: true })}`;
