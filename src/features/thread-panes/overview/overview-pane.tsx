import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { CAPY_ILLUSTRATIONS } from "@/assets/brand";
import { FailedRead } from "@/components/failed-read";
import {
  OverviewSection,
  overviewPullSortAtom,
  type PullSort,
  SurfaceRow,
  SurfaceStack,
} from "@/components/overview-section";
import {
  overviewChildrenAtom,
  overviewLocalPullsAtom,
  overviewPullsAtom,
  overviewRemoveLocalPullAtom,
} from "@/data/atoms/overview";
import { modelsAtom } from "@/data/atoms/models";
import { machinePreviewsAtom, threadMachinesAtom } from "@/data/atoms/setup";
import { useIssueOrgId } from "@/features/issues/issue-parts";
import {
  patchAtom,
  statusAtom,
  turnsAtom,
} from "@/features/thread-panes/diffs-view/diffs-view";
import { threadFeedAtom } from "@/features/thread/timeline";
import { usePaneSession } from "@/features/thread/thread-view/pane-session-context";
import type { PaneProps } from "@/features/thread-panes/thread-pane/registry";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { toast } from "@/primitives/toaster";
import { ConsoleGlyph, FilesGlyph, StudioDisplayGlyph } from "./glyphs";
import {
  allocationLabel,
  childTasks,
  diffsSummary,
  type OverviewData,
  type OverviewPort,
  type OverviewSurfaces,
  type OverviewTask,
  pullVia,
  repoLabel,
  sideThreads,
  sortPulls,
  subagentPaths,
  todoProgress,
} from "./model";
import {
  parseLocalPull,
  parsePort,
  parsePull,
  parseTask,
  valueList,
} from "./parse";
import { overviewModels, overviewSurfaces, threadTodos } from "./sources";
import {
  LocalPullRow,
  type OpenPull,
  PortRow,
  PullRow,
  PullSortMenu,
  SideThreadRow,
  TaskRow,
  TodoRow,
} from "./rows";

const sailUrl = CAPY_ILLUSTRATIONS.sail;

export type OverviewPaneProps = PaneProps;

export type OverviewBodyProps = {
  data: OverviewData;
  surfaces: OverviewSurfaces;
  onOpenTab: (tab: unknown) => void;
  onOpenTask: (task: OverviewTask) => void;
  onOpenSideThread: (task: OverviewTask) => void;
  onOpenPr: (pull: OpenPull) => void;
  onOpenNewTab: (port: OverviewData["ports"][number]) => void;
  onCopyUrl: (port: OverviewData["ports"][number]) => void;
  onRemoveLocalPull: (id: string) => void;
  sort: PullSort;
  onSort: (sort: PullSort) => void;
};

function useResult<T, E>(result: AsyncResult.AsyncResult<T, E>): T | undefined {
  return AsyncResult.isSuccess(result) ? result.value : undefined;
}

export function OverviewBody({
  data,
  surfaces,
  onOpenTab,
  onOpenTask,
  onOpenSideThread,
  onOpenPr,
  onOpenNewTab,
  onCopyUrl,
  onRemoveLocalPull,
  sort,
  onSort,
}: OverviewBodyProps) {
  const paths = subagentPaths(data.tasks, data.jamId);
  const siblings = sideThreads(data.tasks, data.jamId);
  const roots = childTasks(data.tasks, data.jamId);
  const localPulls = data.localPulls;
  const pulls = data.pulls ?? [];
  const empty =
    localPulls.length === 0 &&
    pulls.length === 0 &&
    data.ports.length === 0 &&
    siblings.length === 0 &&
    roots.length === 0 &&
    (data.todos === null || data.todos.length === 0) &&
    surfaces.turns.length === 0;
  const diffs = diffsSummary(surfaces.repos, surfaces.turns);
  return (
    <div className="flex min-h-full flex-col gap-1 p-2">
      {empty ? (
        <SurfaceStack
          mark={
            <img
              src={sailUrl}
              alt="Overview is empty"
              className="h-24 select-none"
            />
          }
        >
          <SurfaceRow
            icon={<FilesGlyph />}
            label="Diffs"
            value={
              diffs.hasTurns ? (
                <span className="tabular-nums">
                  <span className="text-diff-add">+{diffs.additions}</span>{" "}
                  <span className="text-diff-del">-{diffs.deletions}</span>
                </span>
              ) : undefined
            }
            detail={diffs.detail}
            onOpen={() => onOpenTab({ kind: "diffs" })}
          />
          <SurfaceRow
            icon={<ConsoleGlyph />}
            label="Files"
            detail={
              surfaces.repos.length === 0
                ? undefined
                : surfaces.repos.map(repoLabel).join(" · ")
            }
            onOpen={() => onOpenTab({ kind: "files" })}
          />
          {surfaces.machine?.device === false && (
            <SurfaceRow
              icon={<StudioDisplayGlyph />}
              label="Desktop"
              value={allocationLabel(surfaces.machine)}
              onOpen={() => onOpenTab({ kind: "desktop" })}
            />
          )}
        </SurfaceStack>
      ) : (
        <>
          {data.todos !== null && data.todos.length > 0 && (
            <OverviewSection
              jamId={data.jamId}
              sectionId="todos"
              label="Todos"
              count={todoProgress(data.todos)}
              rows={data.todos.map((todo) => (
                <TodoRow key={`${todo.status}:${todo.content}`} todo={todo} />
              ))}
            />
          )}
          {roots.length > 0 && (
            <OverviewSection
              jamId={data.jamId}
              sectionId="tasks"
              label="Subagents"
              count={String(data.totalTasks ?? roots.length)}
              rows={roots.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  depth={0}
                  path={task.localIndex === null ? "" : String(task.localIndex)}
                  subtree={data.tasks}
                  models={data.models}
                  pulls={pulls}
                  onOpenTask={onOpenTask}
                />
              ))}
            />
          )}
          {(pulls.length > 0 || localPulls.length > 0) && (
            <OverviewSection
              jamId={data.jamId}
              sectionId="pulls"
              label="Pull requests"
              count={String(pulls.length + localPulls.length)}
              action={<PullSortMenu sort={sort} onSort={onSort} />}
              rows={[
                ...sortPulls(pulls, sort).map((pull) => (
                  <PullRow
                    key={pull.id}
                    pull={pull}
                    via={pullVia(pull, data.jamId, paths)}
                    onOpenPr={onOpenPr}
                  />
                )),
                ...localPulls.map((pull) => (
                  <LocalPullRow
                    key={pull.id}
                    pull={pull}
                    onRemove={() => onRemoveLocalPull(pull.id)}
                  />
                )),
              ]}
            />
          )}
          {data.ports.length > 0 && (
            <OverviewSection
              jamId={data.jamId}
              sectionId="apps"
              label="Exposed apps"
              count={String(data.ports.length)}
              rows={data.ports.map((port) => (
                <PortRow
                  key={`${port.machineId}:${port.port}`}
                  port={port}
                  onOpen={() => onOpenTab({ kind: "preview", ...port })}
                  onOpenNewTab={() => onOpenNewTab(port)}
                  onCopyUrl={() => onCopyUrl(port)}
                />
              ))}
            />
          )}
          {siblings.length > 0 && (
            <OverviewSection
              jamId={data.jamId}
              sectionId="side_threads"
              label="Side threads"
              count={String(siblings.length)}
              rows={siblings.map((child) => (
                <SideThreadRow
                  key={child.id}
                  child={child}
                  onOpen={() => onOpenSideThread(child)}
                />
              ))}
            />
          )}
        </>
      )}
    </div>
  );
}

/** The address a preview port answers on, which is what Copy URL copies. */
const portUrl = (port: OverviewPort) =>
  `${window.location.origin}/preview/${port.machineId}/${port.port}`;

export function OverviewPane({ threadId }: OverviewPaneProps) {
  const orgId = useIssueOrgId();
  const navigate = useNavigate();
  const { openTab } = usePaneSession();
  const sort = useAtomValue(overviewPullSortAtom);
  const setSort = useAtomSet(overviewPullSortAtom);
  const removeLocalPull = useAtomSet(overviewRemoveLocalPullAtom, {
    mode: "promiseExit",
  });
  const childrenAtom = overviewChildrenAtom(orgId ?? ("" as never), threadId);
  const pullsAtom = overviewPullsAtom(orgId ?? ("" as never), threadId);
  const localPullsAtom = overviewLocalPullsAtom(
    orgId ?? ("" as never),
    threadId,
  );
  const children = useAtomValue(childrenAtom);
  const pulls = useAtomValue(pullsAtom);
  const localPulls = useAtomValue(localPullsAtom);
  const previews = useAtomValue(
    machinePreviewsAtom(orgId ?? ("" as never), threadId),
  );
  const machineRows = useAtomValue(
    threadMachinesAtom(orgId ?? ("" as never), threadId),
  );
  const catalog = useAtomValue(modelsAtom(orgId ?? ""));
  const gitStatus = useAtomValue(statusAtom(threadId));
  const gitTurns = useAtomValue(turnsAtom(threadId));
  const gitPatch = useAtomValue(patchAtom(threadId));
  const feed = useAtomValue(threadFeedAtom(`${orgId ?? ""}/${threadId}`));
  const refreshChildren = useAtomRefresh(childrenAtom);
  const refreshPulls = useAtomRefresh(pullsAtom);
  const refreshLocalPulls = useAtomRefresh(localPullsAtom);
  const failed =
    AsyncResult.isFailure(children) ||
    AsyncResult.isFailure(pulls) ||
    AsyncResult.isFailure(localPulls);
  const pullRows = useResult(pulls);
  const localPullRows = useResult(localPulls);
  const portRows = useResult(previews);
  const catalogValue = useResult(catalog);
  const childRows = useResult(children);
  const data = useMemo<OverviewData>(
    () => ({
      jamId: threadId,
      tasks: valueList(childRows).map(parseTask),
      pulls:
        pullRows === undefined
          ? undefined
          : valueList(pullRows)
              .map(parsePull)
              .filter(
                (pull): pull is NonNullable<typeof pull> => pull !== undefined,
              ),
      localPulls: valueList(localPullRows)
        .map(parseLocalPull)
        .filter((pull): pull is NonNullable<typeof pull> => pull !== undefined),
      // A preview row names the machine it runs on; the thread's own previews
      // are the ones whose thread matches, and the empty field is a machine the
      // mock does not tie to a thread.
      ports: valueList(portRows)
        .filter(
          (row) =>
            typeof row.threadId !== "string" || row.threadId === threadId,
        )
        .map(parsePort)
        .filter((port): port is OverviewPort => port !== undefined),
      models: overviewModels(catalogValue),
      todos: threadTodos(feed.events),
    }),
    [
      catalogValue,
      childRows,
      feed.events,
      localPullRows,
      portRows,
      pullRows,
      threadId,
    ],
  );
  const openOverviewTab = (tab: unknown) => {
    const kind = (tab as { kind?: string }).kind;
    if (kind === "diffs" || kind === "files")
      openTab({ kind, jamId: threadId });
    else if (kind === "desktop")
      openTab({ kind: "desktop", jamId: threadId, localIndex: null });
    else if (kind === "preview") {
      const port = tab as { machineId: string; port: number; title?: string };
      openTab({
        kind: "service_preview",
        machineId: port.machineId,
        port: port.port,
        title: port.title ?? `Port ${port.port}`,
      });
    }
  };
  const surfaces = useMemo<OverviewSurfaces>(
    () =>
      overviewSurfaces({
        status: gitStatus,
        turns: gitTurns,
        patch: gitPatch,
        machines: machineRows,
      }),
    [gitPatch, gitStatus, gitTurns, machineRows],
  );
  // An overview that could not load is not an empty overview: the sail and its
  // "nothing here" rows would claim the thread has no tasks, pulls or diffs.
  if (failed)
    return (
      <FailedRead
        slot="overview-load-failed"
        line="Couldn't load the overview"
        sub="This thread's tasks and pull requests did not load"
        onRetry={() => {
          refreshChildren();
          refreshPulls();
          refreshLocalPulls();
        }}
      />
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="min-h-0 flex-1">
          <OverviewBody
            data={data}
            surfaces={surfaces}
            onOpenTab={openOverviewTab}
            onOpenTask={(task) =>
              void navigate({
                to: "/thread/$threadId",
                params: { threadId: task.id },
              })
            }
            onOpenSideThread={(task) =>
              void navigate({
                to: "/thread/$threadId",
                params: { threadId: task.id },
              })
            }
            onOpenPr={(pull) =>
              void window.open(pull.url, "_blank", "noreferrer")
            }
            onOpenNewTab={(port) =>
              openTab({
                kind: "service_preview",
                machineId: port.machineId,
                port: port.port,
                title: port.title,
              })
            }
            onCopyUrl={(port) =>
              void navigator.clipboard
                ?.writeText(portUrl(port))
                .then(() => toast.success("Copied the preview URL"))
                .catch(() => toast.error("Could not copy the URL"))
            }
            onRemoveLocalPull={(id) =>
              void (
                orgId !== undefined &&
                removeLocalPull({
                  params: { orgId, jamId: threadId, id },
                }).catch(() =>
                  toast.error("Could not remove the pull request link"),
                )
              )
            }
            sort={sort}
            onSort={setSort}
          />
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
