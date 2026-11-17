import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import {
  openUnlessModified,
  PullPreview,
  type PullPreviewProps,
} from "@/components/pull-preview";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import {
  asMachine,
  automationName,
  crewWithoutAsks,
  isCaptain,
  limitSection,
  machineLabel,
  originLabels,
  PREVIEW_LIMIT,
  type PreviewAsk,
  type PreviewMember,
  type PreviewSection,
  previewOrigin,
  threadAsks,
} from "./thread-preview-logic";

export * from "./thread-preview-logic";

export type PreviewIssue = {
  id: string;
  code: string;
  title: string;
  icon?: ReactNode;
};

export type PreviewTask = {
  id: string;
  localIndex: number | null;
  title: string | null;
  icon?: ReactNode;
};

export type PreviewCrewMember = PreviewMember & { icon?: ReactNode };

export type ThreadPreviewProps = Omit<ComponentProps<"div">, "children"> & {
  thread: ThreadCard;
  code?: string | null;
  principal?: ReactNode;
  status?: ReactNode;
  description?: string | null;
  project?: { name: string; icon?: ReactNode };
  model?: { name: string; icon?: ReactNode };
  originIcon?: ReactNode;
  members?: readonly ReactNode[];
  asks?: readonly PreviewAsk[];
  crew?: readonly PreviewCrewMember[];
  issues?: readonly PreviewIssue[];
  tasks?: readonly PreviewTask[];
  multirepo?: boolean;
  shortcut?: ReactNode;
  onOpenTask?: (task: PreviewTask) => void;
  onOpenThread?: (threadId: string) => void;
  onOpenIssue?: (code: string) => void;
  onOpenPr?: PullPreviewProps["onOpen"];
};

const sectionLabel =
  "shrink-0 px-2 pt-2 pb-1 text-2xs font-medium text-muted-foreground-2";
const rowLink = cx(
  "flex h-7 min-w-0 shrink-0 items-center gap-2 rounded-(--radius) px-2 text-sm",
  "cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset",
);
const rowIcon = "flex size-4 shrink-0 items-center justify-center";
const rowTitle = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
const metaItem = "flex items-center gap-1 whitespace-nowrap";
const metaIcon = "size-3 shrink-0";

function MachineIcon({ machine }: { machine: { kind: string } }) {
  return (
    <Icon
      name={machine.kind === "device" ? "macbook" : "cloud"}
      size={null}
      className="size-3 shrink-0 text-muted-foreground-2"
    />
  );
}

function MemberIcon({ member }: { member?: PreviewCrewMember }) {
  const machine = asMachine(member?.primaryMachine);
  return (
    <span className={rowIcon}>
      {member?.icon ??
        (machine === undefined ? null : <MachineIcon machine={machine} />)}
    </span>
  );
}

function MoreRow({
  hidden,
  onExpand,
}: {
  hidden: number;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-7 shrink-0 cursor-pointer items-center rounded-(--radius) px-2 text-2xs font-medium text-muted-foreground-2 transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset"
    >
      {`${hidden} more`}
    </button>
  );
}

export function ThreadPreview({
  thread,
  code,
  principal,
  status,
  description,
  project,
  model,
  originIcon,
  members,
  asks,
  crew = [],
  issues = [],
  tasks = [],
  multirepo = false,
  shortcut,
  onOpenTask,
  onOpenThread,
  onOpenIssue,
  onOpenPr,
  className,
  ...props
}: ThreadPreviewProps) {
  const [expanded, setExpanded] = useState<readonly PreviewSection[]>([]);
  const [issuesExpanded, setIssuesExpanded] = useState(false);
  const expand = (section: PreviewSection) => () =>
    setExpanded((current) => [...current, section]);
  const captain = isCaptain(thread);
  const { header, groups } = threadAsks(thread, asks);
  const headerAsks = header.slice(0, PREVIEW_LIMIT);
  const shownGroups = limitSection(expanded, "asks", groups);
  const quietCrew = crewWithoutAsks(crew, asks, groups);
  const shownCrew = limitSection(expanded, "crew", quietCrew);
  const shownPulls = limitSection(expanded, "pulls", thread.pulls);
  const shownTasks = limitSection(expanded, "tasks", tasks);
  const shownIssues = issuesExpanded ? issues : issues.slice(0, PREVIEW_LIMIT);
  const machine = asMachine(thread.primaryMachine);
  const origin = previewOrigin(thread.origin);
  const automation = thread.archived
    ? undefined
    : automationName(thread.automation);
  const openThread = (threadId: string) =>
    openUnlessModified(onOpenThread, threadId);

  return (
    <div
      data-slot="thread-preview"
      className={cx("-m-1.5 flex max-h-88 min-h-0 flex-col p-0.5", className)}
      {...props}
    >
      <div className="flex shrink-0 flex-col gap-1.5 px-2 pt-1 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground-2">
          {principal}
          {status}
          <span className="whitespace-nowrap">
            {code ?? (captain ? "Captain" : "Thread")}
          </span>
          {shortcut == null ? null : (
            <Kbd variant="chip" className="ml-auto pointer-coarse:hidden">
              {shortcut}
            </Kbd>
          )}
        </div>
        <span className="line-clamp-2 text-sm font-medium text-foreground">
          {thread.title ?? "Untitled thread"}
        </span>
        {headerAsks.map((ask) => (
          <span
            key={ask.key}
            className={cx(
              "text-xs text-primary-ink",
              header.length === 1
                ? "line-clamp-2"
                : "mask-fade-r overflow-hidden whitespace-nowrap",
            )}
          >
            {ask.text ?? thread.preview}
          </span>
        ))}
        {header.length > headerAsks.length && (
          <span className="text-2xs font-medium text-muted-foreground-2">
            {`${header.length - headerAsks.length} more`}
          </span>
        )}
        {description == null ? null : (
          <span className="line-clamp-2 text-xs text-muted-foreground-1">
            {description}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground-2">
          {project === undefined ? null : (
            <span className="flex min-w-0 items-center gap-1">
              {project.icon}
              <span className="truncate">{project.name}</span>
            </span>
          )}
          {machine === undefined ? null : (
            <span className={metaItem}>
              <MachineIcon machine={machine} />
              {machineLabel(machine)}
            </span>
          )}
          {model === undefined ? null : (
            <span className={metaItem}>
              {model.icon}
              {model.name}
            </span>
          )}
          {origin === undefined || originIcon === undefined ? null : (
            <span className={metaItem}>
              {originIcon}
              {originLabels[origin]}
            </span>
          )}
          {automation === undefined ? null : (
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="calendar-clock" size={null} className={metaIcon} />
              <span className="truncate">{automation}</span>
            </span>
          )}
          {thread.personal && thread.captain === undefined && members ? (
            <span className={metaItem}>
              <Icon name="lock" size={null} className={metaIcon} />
              {members.length === 0 ? "Private" : null}
              <span className="flex items-center">{members.slice(0, 4)}</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-col overflow-x-hidden overflow-y-auto md:scroll-fade-y">
        {groups.length > 0 && (
          <>
            <span className={sectionLabel}>Asks</span>
            {shownGroups.map(([key, items]) => {
              const first = items[0];
              if (first === undefined) return null;
              const member = crew.find((m) => m.id === first.threadId);
              const count = new Set(items.map((ask) => ask.threadId)).size;
              return (
                <Link
                  key={key}
                  to="/thread/$threadId"
                  params={{ threadId: thread.id }}
                  search={{ pane: `side-thread:${first.threadId}` }}
                  onClick={openThread(first.threadId)}
                  className={cx(
                    "flex min-w-0 shrink-0 flex-col gap-0.5 rounded-(--radius) px-2 py-1 text-sm",
                    "cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MemberIcon member={member} />
                    <span className={cx(rowTitle, "text-foreground")}>
                      {count > 1
                        ? `${count} threads`
                        : (member?.title ?? "Untitled thread")}
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 pl-6 text-xs text-muted-foreground-2 text-primary-ink">
                    <span className={rowTitle}>
                      {first.text ?? member?.preview}
                    </span>
                  </span>
                </Link>
              );
            })}
            {groups.length > shownGroups.length && (
              <MoreRow
                hidden={groups.length - shownGroups.length}
                onExpand={expand("asks")}
              />
            )}
          </>
        )}
        {quietCrew.length > 0 && (
          <>
            <span className={sectionLabel}>Crew</span>
            {shownCrew.map((member) => (
              <Link
                key={member.id}
                to="/thread/$threadId"
                params={{ threadId: thread.id }}
                search={{ pane: `side-thread:${member.id}` }}
                onClick={openThread(member.id)}
                className={rowLink}
              >
                <MemberIcon member={member} />
                <span className={cx(rowTitle, "text-foreground")}>
                  {member.title ?? "Untitled thread"}
                </span>
              </Link>
            ))}
            {quietCrew.length > shownCrew.length && (
              <MoreRow
                hidden={quietCrew.length - shownCrew.length}
                onExpand={expand("crew")}
              />
            )}
          </>
        )}
        {issues.length > 0 && (
          <>
            <span className={sectionLabel}>Issues</span>
            {shownIssues.map((issue) => (
              <Link
                key={issue.id}
                to="/issues/$code"
                params={{ code: issue.code }}
                onClick={openUnlessModified(onOpenIssue, issue.code)}
                className={rowLink}
              >
                <span className={rowIcon}>{issue.icon}</span>
                <span className="shrink-0 text-muted-foreground-2">
                  {issue.code}
                </span>
                <span className={cx(rowTitle, "text-foreground")}>
                  {issue.title}
                </span>
              </Link>
            ))}
            {issues.length > shownIssues.length && (
              <MoreRow
                hidden={issues.length - shownIssues.length}
                onExpand={() => setIssuesExpanded(true)}
              />
            )}
          </>
        )}
        {thread.pulls.length > 0 && (
          <>
            <span className={sectionLabel}>Pull requests</span>
            <div className="m-1.5 shrink-0">
              <PullPreview
                prs={shownPulls}
                multirepo={multirepo}
                onOpen={onOpenPr}
              />
            </div>
            {thread.pulls.length > shownPulls.length && (
              <MoreRow
                hidden={thread.pulls.length - shownPulls.length}
                onExpand={expand("pulls")}
              />
            )}
          </>
        )}
        {tasks.length > 0 && (
          <>
            <span className={sectionLabel}>Subagents</span>
            {shownTasks.map((task) => {
              const content = (
                <>
                  <span className={rowIcon}>{task.icon}</span>
                  <span className="shrink-0 text-muted-foreground-2">
                    {task.localIndex === null
                      ? "Subagent"
                      : `Subagent ${task.localIndex}`}
                  </span>
                  <span className={cx(rowTitle, "text-foreground")}>
                    {task.title ?? "Untitled subagent"}
                  </span>
                </>
              );
              return onOpenTask === undefined ? (
                <Link
                  key={task.id}
                  to="/thread/$threadId"
                  params={{ threadId: thread.id }}
                  search={{ pane: `task:${task.id}` }}
                  className={rowLink}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={task.id}
                  type="button"
                  onClick={(event: MouseEvent) => {
                    event.preventDefault();
                    onOpenTask(task);
                  }}
                  className={cx(rowLink, "text-left")}
                >
                  {content}
                </button>
              );
            })}
            {tasks.length > shownTasks.length && (
              <MoreRow
                hidden={tasks.length - shownTasks.length}
                onExpand={expand("tasks")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
