import { cx } from "class-variance-authority";
import { Fragment, type ReactNode } from "react";
import { toast } from "sonner";
import {
  overviewRow,
  overviewRowIcon,
  overviewRowInteractive,
  overviewRowLine,
  overviewRowMeta,
  overviewRowTitle,
  type PullSort,
} from "@/components/overview-section";
import { ThreadStatus } from "@/components/thread-status";
import {
  DiffStat,
  LocalPullRowView,
  localPullRowState,
  PullRequestGlyph,
  PullStateIcon,
  repoName,
} from "@/features/thread/local-pull-rows";
import { Button } from "@/primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  ArrowRightGlyph,
  ArrowShareRightGlyph,
  ChainLinkGlyph,
  CheckmarkGlyph,
  CloudGlyph,
  GlobeGlyph,
  LaptopGlyph,
  SortArrowUpDownGlyph,
} from "./glyphs";
import {
  childPath,
  childTasks,
  type MachineMark,
  machineMarkLabel,
  type OverviewModel,
  type OverviewPort,
  type OverviewPull,
  type OverviewTask,
  type OverviewTodo,
  PULL_SORT_GROUPS,
  relativeTime,
} from "./model";

const rowButton = cx(overviewRow, overviewRowInteractive);
const rowTitle = cx(overviewRowTitle, "font-medium text-foreground");
const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const MAX_DEPTH = 3;

const depthStyle = (depth: number) =>
  depth > 0
    ? { paddingLeft: `calc(var(--spacing-2) + ${depth} * var(--spacing-3))` }
    : undefined;

function DepthMark({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <Icon
      name="arrow-corner-left-up"
      size="xs"
      className="shrink-0 text-muted-foreground-3"
    />
  );
}

export function ThreadMachineMark({
  machine,
  className,
}: {
  machine: MachineMark | null;
  className?: string;
}) {
  if (machine === null)
    return (
      <span
        aria-hidden
        data-machine-placeholder=""
        className={cx("size-(--icon-sm) shrink-0", className)}
      />
    );
  const Mark = machine.kind === "device" ? LaptopGlyph : CloudGlyph;
  return (
    <span
      data-machine-indicator=""
      role="img"
      aria-label={machineMarkLabel(machine)}
      className={cx(
        "inline-flex size-(--icon-sm) shrink-0 items-center justify-center",
        className,
      )}
    >
      <Mark className="size-full" />
    </span>
  );
}

function TaskStatus({ task }: { task: OverviewTask }) {
  if (task.status !== "working" && task.status !== "waiting") return null;
  return <ThreadStatus data-status={task.status} />;
}

export type ChildJamMenuProps = {
  jamId: string;
  title: string;
  onOpen: () => void;
  origin?: string;
  children: ReactNode;
};

export function ChildJamMenu({
  jamId,
  title,
  onOpen,
  origin = globalThis.location?.origin ?? "",
  children,
}: ChildJamMenuProps) {
  const copyLink = () =>
    void navigator.clipboard.writeText(`${origin}/thread/${jamId}`).then(
      () => toast.success("Link copied", { description: title }),
      () => toast.error("Could not copy link", { description: title }),
    );
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <MenuItem onClick={onOpen}>
          <span className={menuIcon}>
            <ArrowRightGlyph />
          </span>
          Open
        </MenuItem>
        <MenuItem
          onClick={() => void window.open(`/thread/${jamId}`, "_blank")}
        >
          <span className={menuIcon}>
            <Icon name="arrow-corner-up-right" size="sm" />
          </span>
          Open in new tab
        </MenuItem>
        <MenuItem onClick={copyLink}>
          <span className={menuIcon}>
            <ArrowShareRightGlyph />
          </span>
          Copy link
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export type TaskRowProps = {
  task: OverviewTask;
  depth: number;
  path: string;
  subtree: ReadonlyArray<OverviewTask>;
  models: ReadonlyArray<OverviewModel>;
  pulls: ReadonlyArray<OverviewPull> | undefined;
  onOpenTask: (task: OverviewTask) => void;
  now?: number;
};

export function TaskRow({
  task,
  depth,
  path,
  subtree,
  models,
  pulls,
  onOpenTask,
  now,
}: TaskRowProps) {
  const model = models.find((candidate) => candidate.id === task.modelId);
  const ownPulls = pulls?.filter((pull) => pull.jamId === task.id) ?? [];
  const indent = Math.min(depth, MAX_DEPTH);
  return (
    <>
      <ChildJamMenu
        jamId={task.id}
        title={task.title ?? "Subagent"}
        onOpen={() => onOpenTask(task)}
      >
        <button
          type="button"
          data-slot="overview-task-row"
          onClick={() => onOpenTask(task)}
          className={rowButton}
          style={depthStyle(indent)}
        >
          <span className={overviewRowLine}>
            <DepthMark depth={indent} />
            <span className={overviewRowIcon}>
              <ThreadMachineMark
                machine={task.machine}
                className="text-foreground"
              />
            </span>
            {path !== "" && (
              <span className="shrink-0 text-muted-foreground-2 tabular-nums">
                Subagent {path}
              </span>
            )}
            <span className={rowTitle}>{task.title}</span>
            <TaskStatus task={task} />
          </span>
          <span className={cx(overviewRowMeta, indent > 0 && "pl-11")}>
            {model !== undefined && (
              <>
                <span className="shrink-0">{model.name}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="shrink-0">
              {relativeTime(task.lastActivityAt ?? task.createdAt, {
                minified: true,
                now,
              })}
            </span>
            {ownPulls.map((pull) => (
              <Fragment key={pull.id}>
                <span aria-hidden>·</span>
                <PullRequestGlyph className="size-3 shrink-0" />
                <span className="shrink-0 tabular-nums">
                  {repoName(pull.repo)}#{pull.number}
                </span>
              </Fragment>
            ))}
          </span>
        </button>
      </ChildJamMenu>
      {childTasks(subtree, task.id).map((child) => (
        <TaskRow
          key={child.id}
          task={child}
          depth={depth + 1}
          path={childPath(path, child.localIndex)}
          subtree={subtree}
          models={models}
          pulls={pulls}
          onOpenTask={onOpenTask}
          now={now}
        />
      ))}
    </>
  );
}

export type OpenPull = { number: number; url: string };

export type PullRowProps = {
  pull: OverviewPull;
  depth?: number;
  via?: string;
  onOpenPr: (pull: OpenPull) => void;
};

export function PullRow({ pull, depth = 0, via, onOpenPr }: PullRowProps) {
  const indent = Math.min(depth, MAX_DEPTH);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">
        <button
          type="button"
          data-slot="overview-pull-row"
          onClick={() => onOpenPr({ number: pull.number, url: pull.url })}
          className={rowButton}
          style={depthStyle(indent)}
        >
          <span className={overviewRowLine}>
            <DepthMark depth={indent} />
            <span className={overviewRowIcon}>
              <PullStateIcon state={pull.state} />
            </span>
            <span className="shrink-0 text-muted-foreground-2 tabular-nums">
              {repoName(pull.repo)}#{pull.number}
            </span>
            <span className={rowTitle}>{pull.title}</span>
          </span>
          <span className={overviewRowMeta}>
            <span className="min-w-0 truncate tabular-nums">
              {pull.baseRef} ← {pull.headRef}
            </span>
            <DiffStat additions={pull.additions} deletions={pull.deletions} />
            {via !== undefined && (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0">{via}</span>
              </>
            )}
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <MenuItem
          onClick={() => onOpenPr({ number: pull.number, url: pull.url })}
        >
          <span className={menuIcon}>
            <ArrowRightGlyph />
          </span>
          Open
        </MenuItem>
        <MenuItem
          onClick={() => void window.open(pull.url, "_blank", "noreferrer")}
        >
          <span className={menuIcon}>
            <Icon name="github" size="sm" />
          </span>
          Open in GitHub
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export type PullSortMenuProps = {
  sort: PullSort;
  onSort: (sort: PullSort) => void;
};

export function PullSortMenu({ sort, onSort }: PullSortMenuProps) {
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <Button
                  variant="bare"
                  size="icon-shrink"
                  aria-label="Sort pull requests"
                  className="mr-1 p-1"
                />
              }
            >
              <SortArrowUpDownGlyph />
            </MenuTrigger>
          }
        />
        <TooltipContent side="bottom">Sort</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-48">
        <MenuLabel>Sort by</MenuLabel>
        {PULL_SORT_GROUPS.map((group, index) => (
          <Fragment key={group[0]?.value}>
            {index > 0 && <MenuSeparator />}
            {group.map((option) => (
              <MenuItem key={option.value} onClick={() => onSort(option.value)}>
                {option.label}
                {sort === option.value ? (
                  <CheckmarkGlyph className="ml-auto size-(--icon-sm) shrink-0 text-foreground" />
                ) : null}
              </MenuItem>
            ))}
          </Fragment>
        ))}
      </MenuContent>
    </Menu>
  );
}

export type PortRowProps = {
  port: OverviewPort;
  onOpen: () => void;
  onOpenNewTab: () => void;
  onCopyUrl: () => void;
};

export function PortRow({
  port,
  onOpen,
  onOpenNewTab,
  onCopyUrl,
}: PortRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">
        <button
          type="button"
          data-slot="overview-port-row"
          className={rowButton}
          onClick={(event) =>
            event.metaKey || event.ctrlKey ? onOpenNewTab() : onOpen()
          }
        >
          <span className={overviewRowLine}>
            <span className={overviewRowIcon}>
              <GlobeGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-2" />
            </span>
            <span className={rowTitle}>{port.title}</span>
          </span>
          <span className={overviewRowMeta}>
            <span className={overviewRowTitle}>Port {port.port}</span>
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <MenuItem onClick={onOpenNewTab}>
          <span className={menuIcon}>
            <Icon name="arrow-corner-up-right" size="sm" />
          </span>
          Open in new tab
        </MenuItem>
        <MenuItem onClick={onCopyUrl}>
          <span className={menuIcon}>
            <ChainLinkGlyph />
          </span>
          Copy URL
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export type SideThreadRowProps = {
  child: OverviewTask;
  onOpen: () => void;
  now?: number;
};

export function SideThreadRow({ child, onOpen, now }: SideThreadRowProps) {
  const title = child.title ?? "Side thread";
  return (
    <ChildJamMenu jamId={child.id} title={title} onOpen={onOpen}>
      <button
        type="button"
        data-slot="overview-side-thread-row"
        onClick={onOpen}
        className={rowButton}
      >
        <span className={overviewRowLine}>
          <span className={overviewRowIcon}>
            <ThreadMachineMark
              machine={child.machine}
              className="text-foreground"
            />
          </span>
          <span className={rowTitle}>{title}</span>
          <TaskStatus task={child} />
        </span>
        <span className={overviewRowMeta}>
          <span className="shrink-0">
            {relativeTime(child.createdAt, { minified: true, now })}
          </span>
        </span>
      </button>
    </ChildJamMenu>
  );
}

function TodoStatusIcon({ status }: { status: OverviewTodo["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Icon
          name="circle-dotted"
          size="sm"
          className="text-muted-foreground-3"
        />
      );
    case "in_progress":
      return <Icon name="progress-50" size="sm" className="text-progress" />;
    case "completed":
      return <Icon name="circle-check" size="sm" className="text-success" />;
    case "cancelled":
      return (
        <Icon name="circle-x" size="sm" className="text-muted-foreground-3" />
      );
    case "deferred":
      return (
        <Icon
          name="clock-alert"
          size="sm"
          className="text-muted-foreground-3"
        />
      );
  }
}

export function TodoRow({
  todo,
  upcoming = false,
}: {
  todo: OverviewTodo;
  upcoming?: boolean;
}) {
  const tone =
    todo.status === "completed" || todo.status === "cancelled"
      ? "text-muted-foreground-2 line-through"
      : upcoming
        ? "text-muted-foreground-1"
        : "text-foreground";
  return (
    <div data-slot="overview-todo-row" className={overviewRow}>
      <span className={overviewRowLine}>
        <span className={overviewRowIcon}>
          <TodoStatusIcon status={todo.status} />
        </span>
        <span className={cx(overviewRowTitle, tone)}>{todo.content}</span>
      </span>
    </div>
  );
}

export function OverviewSkeleton() {
  const groups = [
    { header: "w-10", rows: ["w-3/5", "w-2/5"] },
    { header: "w-14", rows: ["w-1/2", "w-2/3", "w-2/5"] },
  ];
  return (
    <div
      role="status"
      aria-busy
      aria-label="Loading overview"
      className="flex flex-col gap-1 opacity-100 transition-opacity delay-250 duration-base ease-out-quint starting:opacity-0"
    >
      <div className="animate-skeleton-pulse h-full motion-reduce:animate-none">
        {groups.map((group) => (
          <div key={group.header} className="flex flex-col gap-1 py-1">
            <div className="flex h-7 items-center px-2">
              <span
                className={cx("h-2.5 rounded bg-secondary", group.header)}
              />
            </div>
            {group.rows.map((width) => (
              <div
                key={width}
                className="flex flex-col gap-1.5 rounded px-2 py-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <span className="size-4 shrink-0 rounded bg-secondary" />
                  <span className={cx("h-3 rounded bg-secondary", width)} />
                </span>
                <span className="ml-6 h-2.5 w-24 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export type LocalPullRowProps = {
  pull: import("@/features/thread/local-pull-rows").LocalPull;
  onRemove: () => void;
};

export function LocalPullRow({ pull, onRemove }: LocalPullRowProps) {
  return (
    <LocalPullRowView
      pull={pull}
      state={localPullRowState({
        reachable: true,
        answer: undefined,
        refreshing: false,
        onRefresh: () => undefined,
        githubLinked: true,
      })}
      recorder={null}
      onRemove={onRemove}
    />
  );
}
