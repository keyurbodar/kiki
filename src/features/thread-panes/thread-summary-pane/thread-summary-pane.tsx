import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useMemo, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import {
  overviewPullSortAtom,
  type PullSort,
} from "@/components/overview-section";
import { JamId, type OrgId } from "@/data/api/schemas/ids";
import {
  archiveJamsAtom,
  captainsAtom,
  idleCaptainsAtom,
} from "@/data/atoms/captains";
import { reactivityKeys } from "@/data/atoms/conventions";
import { jamEventKey, sendMessageAtom } from "@/data/atoms/events";
import { allIssuesAtom, idleAllIssuesAtom } from "@/data/atoms/issues";
import {
  idleOverviewChildrenAtom,
  idleOverviewPullsAtom,
  overviewChildrenAtom,
  overviewPullsAtom,
} from "@/data/atoms/overview";
import {
  type CrewThread,
  leaveCrewAtom,
} from "@/features/captains/overview/captain-data";
import { useCaptainCrew } from "@/features/captains/overview/use-captain";
import { useIssueOrgId } from "@/features/issues/issue-parts";
import { DiffStat, repoName } from "@/features/thread/local-pull-rows";
import { statusDotColors } from "@/features/thread/local-pull-rows/model";
import { usePaneSession } from "@/features/thread/thread-view/pane-session-context";
import {
  childTasks,
  type OverviewPull,
  type OverviewTask,
  sortPulls,
} from "@/features/thread-panes/overview/model";
import {
  parsePull,
  parseTask,
  valueList,
} from "@/features/thread-panes/overview/parse";
import { PullSortMenu } from "@/features/thread-panes/overview/rows";
import type { PaneProps } from "@/features/thread-panes/thread-pane/registry";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Dialog, DialogContent } from "@/primitives/dialog";
import { DialogPages } from "@/primitives/dialog-pages";
import { Icon } from "@/primitives/icon";
import { MenuItem } from "@/primitives/menu";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";
import {
  captainIssueActivityAtom,
  crewMeta,
  type InProgressIssue,
  idleCaptainIssueActivityAtom,
  inProgressIssues,
  issueMeta,
  subagentMeta,
} from "./model";

const rowClass =
  "flex min-h-11.5 w-full flex-col justify-center gap-0.5 rounded-(--radius) px-2 py-1 text-left text-sm cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";
const rowTitle = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
const rowMeta =
  "flex h-4 min-w-0 items-center gap-1.5 text-xs text-muted-foreground-2";
const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";

const dotClass = "size-3.5 shrink-0 rounded-full";

type Tone = keyof typeof statusDotColors;

const threadTone = (status: CrewThread["status"]): Tone =>
  status === "working" ? "accent" : status === "waiting" ? "info" : "neutral";

const taskTone = (task: OverviewTask): Tone =>
  task.status === "working"
    ? "accent"
    : task.status === "waiting"
      ? "info"
      : task.status === "failed"
        ? "danger"
        : "neutral";

const pullTone = (pull: OverviewPull): Tone =>
  pull.state === "ready"
    ? "success"
    : pull.state === "merged"
      ? "success"
      : pull.state === "pending"
        ? "warning"
        : pull.state === "failed" || pull.state === "closed"
          ? "danger"
          : "neutral";

/** One two-line row of the summary: title over a dot and its meta. */
function SummaryRow({
  slot,
  title,
  meta,
  tone,
  unread = false,
  trailing,
  onClick,
  menu,
}: {
  slot: string;
  title: ReactNode;
  meta: string;
  tone: Tone;
  unread?: boolean;
  trailing?: ReactNode;
  onClick: () => void;
  menu?: ReactNode;
}) {
  const body = (
    <button
      type="button"
      data-slot={slot}
      onClick={onClick}
      className={rowClass}
    >
      <span className="flex h-5 min-w-0 items-center">
        <span
          className={cx(
            rowTitle,
            unread
              ? "font-semibold text-foreground"
              : "font-normal text-foreground",
          )}
        >
          {title}
        </span>
      </span>
      {meta === "" ? null : (
        <span className={rowMeta}>
          <span aria-hidden className={cx(dotClass, statusDotColors[tone])} />
          <span className="min-w-0 truncate whitespace-nowrap">{meta}</span>
          {trailing === undefined ? null : (
            <span className="ml-auto shrink-0 pl-2">{trailing}</span>
          )}
        </span>
      )}
    </button>
  );
  if (menu === undefined) return body;
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{body}</ContextMenuTrigger>
      {menu}
    </ContextMenu>
  );
}

/** A collapsible block of the summary: label, count, chevron, then its rows. */
function SummarySection({
  sectionId,
  label,
  count,
  action,
  children,
}: {
  sectionId: string;
  label: string;
  /** Omitted when the surface does not know the count — a failed read is not zero. */
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Collapsible
      data-section={sectionId}
      open={!collapsed}
      onOpenChange={(next) => setCollapsed(!next)}
    >
      <div className="flex h-7 w-full items-center rounded-(--radius) bg-section">
        <CollapsibleTrigger
          block
          showChevron={false}
          className="h-full flex-1 gap-1.5 px-2 text-sm"
        >
          <span className="text-foreground">{label}</span>
          {count === undefined ? null : (
            <span className="font-normal text-muted-foreground-3 tabular-nums">
              {count}
            </span>
          )}
          <Icon
            name="chevron-down-small"
            size="sm"
            className="ml-auto -rotate-90 text-muted-foreground-3 group-data-[panel-open]/collapsible:rotate-0"
          />
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsiblePanel>
        <div className="flex flex-col">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export type ThreadSummaryRows = {
  inProgress: ReadonlyArray<InProgressIssue>;
  threads: ReadonlyArray<CrewThread>;
  subagents: ReadonlyArray<OverviewTask>;
  pulls: ReadonlyArray<OverviewPull>;
};

export type ThreadSummaryBodyProps = ThreadSummaryRows & {
  /** The crew read failed, so no thread rows are known — not that there are none. */
  threadsFailed?: boolean;
  onRetryThreads?: () => void;
  now: number;
  sort: PullSort;
  onSort: (sort: PullSort) => void;
  onOpenIssue: (issue: InProgressIssue) => void;
  onOpenThread: (thread: CrewThread) => void;
  onMessageThread: (thread: CrewThread) => void;
  onRemoveThread: (thread: CrewThread) => void;
  onArchiveThread: (thread: CrewThread) => void;
  onOpenSubagent: (task: OverviewTask) => void;
  onOpenPull: (pull: OverviewPull) => void;
};

/**
 * The thread summary: the four sections Capy's chat pane shows, in its order.
 * A section with no rows renders nothing at all.
 */
export function ThreadSummaryBody({
  inProgress,
  threads,
  threadsFailed = false,
  onRetryThreads,
  subagents,
  pulls,
  now,
  sort,
  onSort,
  onOpenIssue,
  onOpenThread,
  onMessageThread,
  onRemoveThread,
  onArchiveThread,
  onOpenSubagent,
  onOpenPull,
}: ThreadSummaryBodyProps) {
  return (
    <div data-slot="thread-summary-pane" className="flex flex-col gap-1 p-2">
      {inProgress.length === 0 ? null : (
        <SummarySection
          sectionId="in_progress"
          label="In progress"
          count={inProgress.length}
        >
          {inProgress.map((issue) => (
            <SummaryRow
              key={issue.id}
              slot="thread-summary-issue-row"
              title={issue.title}
              meta={issueMeta(issue)}
              tone="accent"
              onClick={() => onOpenIssue(issue)}
            />
          ))}
        </SummarySection>
      )}
      {threads.length === 0 && !threadsFailed ? null : (
        <SummarySection
          sectionId="threads"
          label="Threads"
          count={threadsFailed ? undefined : threads.length}
        >
          {threadsFailed ? (
            // A crew that could not load must not read as a thread with no
            // crew: the section stays, and says what failed, with its retry.
            <FailedRead
              slot="thread-summary-crew-failed"
              line="Couldn't load this thread's crew"
              sub="Its crew did not load"
              onRetry={onRetryThreads}
            />
          ) : (
            threads.map((thread) => (
              <SummaryRow
                key={thread.id}
                slot="thread-summary-thread-row"
                title={thread.title ?? "Untitled thread"}
                meta={crewMeta(thread, now)}
                tone={threadTone(thread.status)}
                unread={thread.unread}
                onClick={() => onOpenThread(thread)}
                menu={
                  <ContextMenuContent className="w-60">
                    <MenuItem onClick={() => onOpenThread(thread)}>
                      <span className={menuIcon}>
                        <Icon name="arrow-corner-up-right" size="sm" />
                      </span>
                      Open as its own thread
                    </MenuItem>
                    <MenuItem onClick={() => onMessageThread(thread)}>
                      <span className={menuIcon}>
                        <Icon name="bubble-text" size="sm" />
                      </span>
                      Message thread
                    </MenuItem>
                    <MenuItem onClick={() => onRemoveThread(thread)}>
                      <span className={menuIcon}>
                        <Icon name="user-remove" size="sm" />
                      </span>
                      Remove from crew
                    </MenuItem>
                    <MenuItem onClick={() => onArchiveThread(thread)}>
                      <span className={menuIcon}>
                        <Icon name="mailbox" size="sm" />
                      </span>
                      Archive thread
                    </MenuItem>
                  </ContextMenuContent>
                }
              />
            ))
          )}
        </SummarySection>
      )}
      {subagents.length === 0 ? null : (
        <SummarySection
          sectionId="subagents"
          label="Subagents"
          count={subagents.length}
        >
          {subagents.map((task, index) => (
            <SummaryRow
              key={task.id}
              slot="thread-summary-subagent-row"
              title={task.title ?? "Subagent"}
              meta={subagentMeta(task, index, now)}
              tone={taskTone(task)}
              onClick={() => onOpenSubagent(task)}
            />
          ))}
        </SummarySection>
      )}
      {pulls.length === 0 ? null : (
        <SummarySection
          sectionId="pulls"
          label="Pull requests"
          count={pulls.length}
          action={<PullSortMenu sort={sort} onSort={onSort} />}
        >
          {sortPulls(pulls, sort).map((pull) => (
            <SummaryRow
              key={pull.id}
              slot="thread-summary-pull-row"
              title={
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="shrink-0 text-muted-foreground-2 tabular-nums">
                    {repoName(pull.repo)}#{pull.number}
                  </span>
                  <span className="truncate">{pull.title}</span>
                </span>
              }
              meta={`${pull.baseRef} ← ${pull.headRef}`}
              tone={pullTone(pull)}
              trailing={
                <DiffStat
                  additions={pull.additions}
                  deletions={pull.deletions}
                />
              }
              onClick={() => onOpenPull(pull)}
            />
          ))}
        </SummarySection>
      )}
    </div>
  );
}

/** The thread's own summary, read from the atoms the thread route already loads. */
export function ThreadSummaryPane({ threadId }: PaneProps) {
  const orgId = useIssueOrgId();
  const navigate = useNavigate();
  const { openTab } = usePaneSession();
  const sort = useAtomValue(overviewPullSortAtom);
  const setSort = useAtomSet(overviewPullSortAtom);
  const [messaging, setMessaging] = useState<CrewThread | null>(null);
  const now = Date.now();

  const childrenResult = useAtomValue(
    orgId === undefined
      ? idleOverviewChildrenAtom
      : overviewChildrenAtom(orgId, threadId),
  );
  const pullsResult = useAtomValue(
    orgId === undefined
      ? idleOverviewPullsAtom
      : overviewPullsAtom(orgId, threadId),
  );
  const issuesResult = useAtomValue(
    orgId === undefined ? idleAllIssuesAtom : allIssuesAtom(orgId),
  );
  const captainsResult = useAtomValue(
    orgId === undefined ? idleCaptainsAtom : captainsAtom(orgId),
  );
  // Only a Captain has a crew to read: asking for one on any other thread is a
  // request that can only answer 404, which would paint a false failure.
  const isCaptain =
    AsyncResult.isSuccess(captainsResult) &&
    captainsResult.value.some((card) => card.id === threadId);
  const {
    crew,
    failed: crewFailed,
    retry: retryCrew,
  } = useCaptainCrew(orgId, threadId, isCaptain);
  const activityResult = useAtomValue(
    orgId === undefined
      ? idleCaptainIssueActivityAtom
      : captainIssueActivityAtom(orgId, threadId),
  );

  const rows = useMemo<ThreadSummaryRows>(() => {
    const tasks = valueList(
      AsyncResult.isSuccess(childrenResult) ? childrenResult.value : undefined,
    ).map(parseTask);
    const issues = AsyncResult.isSuccess(issuesResult)
      ? issuesResult.value.issues
      : [];
    return {
      inProgress: AsyncResult.isSuccess(activityResult)
        ? inProgressIssues(activityResult.value, issues)
        : [],
      threads: crew ?? [],
      subagents: childTasks(tasks, threadId).toSorted(
        (a, b) => (a.localIndex ?? 0) - (b.localIndex ?? 0),
      ),
      pulls: valueList(
        AsyncResult.isSuccess(pullsResult) ? pullsResult.value : undefined,
      )
        .map(parsePull)
        .filter((pull): pull is OverviewPull => pull !== undefined),
    };
  }, [
    activityResult,
    childrenResult,
    crew,
    issuesResult,
    pullsResult,
    threadId,
  ]);

  const leaveCrew = useAtomSet(leaveCrewAtom, { mode: "promise" });
  const archive = useAtomSet(archiveJamsAtom, { mode: "promise" });
  const keys = (id: string) => [
    `jam:${orgId ?? ""}`,
    `jam:${id}`,
    `captain:${threadId}`,
    `jam_relation:${threadId}`,
  ];

  const openThread = (id: string) =>
    void navigate({ to: "/thread/$threadId", params: { threadId: id } });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="min-h-0 flex-1">
          <ThreadSummaryBody
            {...rows}
            threadsFailed={crewFailed}
            onRetryThreads={retryCrew}
            now={now}
            sort={sort}
            onSort={setSort}
            onOpenIssue={(issue) =>
              openTab({ kind: "issue", code: issue.code })
            }
            onOpenThread={(thread) => openThread(thread.id)}
            onMessageThread={setMessaging}
            onRemoveThread={(thread) => {
              if (orgId === undefined) return;
              leaveCrew({
                params: { orgId, jamId: threadId, threadId: thread.id },
                reactivityKeys: keys(thread.id),
              })
                .then(() =>
                  toast.success("Removed from crew", {
                    description: thread.title ?? "Untitled thread",
                  }),
                )
                .catch(() =>
                  toast.error("Could not remove from crew", {
                    description: thread.title ?? "Untitled thread",
                  }),
                );
            }}
            onArchiveThread={(thread) => {
              if (orgId === undefined) return;
              archive({
                params: { orgId },
                payload: { jamIds: [JamId.make(thread.id)] },
                reactivityKeys: keys(thread.id),
              })
                .then(() =>
                  toast.success("Thread archived", {
                    description: thread.title ?? "Untitled thread",
                  }),
                )
                .catch(() =>
                  toast.error("Could not archive thread", {
                    description: thread.title ?? "Untitled thread",
                  }),
                );
            }}
            onOpenSubagent={(task) => openThread(task.id)}
            onOpenPull={(pull) =>
              openTab({ kind: "pr", number: pull.number, url: pull.url })
            }
          />
        </ScrollAreaViewport>
      </ScrollArea>
      {messaging === null || orgId === undefined ? null : (
        <MessageThreadDialog
          orgId={orgId}
          thread={messaging}
          onClose={() => setMessaging(null)}
        />
      )}
    </div>
  );
}

/** Capy's "Message thread": one message to a crew thread, from its row. */
function MessageThreadDialog({
  orgId,
  thread,
  onClose,
}: {
  orgId: OrgId;
  thread: CrewThread;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const send = useAtomSet(sendMessageAtom, { mode: "promise" });
  const title = thread.title ?? "Untitled thread";
  const submit = () => {
    const body = text.trim();
    if (body === "") return;
    send({
      params: { orgId, jamId: thread.id },
      payload: {
        text: body,
        delivery: "steer",
        clientKey: crypto.randomUUID(),
      },
      reactivityKeys: [jamEventKey(thread.id), reactivityKeys.threads(orgId)],
    })
      .then(() => {
        onClose();
        toast.success("Message sent", { description: title });
      })
      .catch(() =>
        toast.error("Could not send the message", { description: title }),
      );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogPages
          page="message"
          root="message"
          onBack={onClose}
          pages={{
            message: {
              title: "Message thread",
              body: (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground-2">
                    {title}
                  </span>
                  <Textarea
                    aria-label="Message"
                    autoFocus
                    rows={3}
                    value={text}
                    placeholder="Send a message to this thread"
                    onChange={(event) => setText(event.target.value)}
                  />
                </div>
              ),
              footer: (
                <>
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    intent="accent"
                    type="button"
                    disabled={text.trim() === ""}
                    onClick={submit}
                  >
                    Send
                  </Button>
                </>
              ),
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
