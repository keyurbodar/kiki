import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { toast } from "sonner";
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
import { useIssueOrgId } from "@/features/issues/issue-parts";
import type { PaneProps } from "@/features/thread-panes/thread-pane/registry";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { ConsoleGlyph, FilesGlyph, StudioDisplayGlyph } from "./glyphs";
import {
  allocationLabel,
  childTasks,
  diffsSummary,
  type OverviewData,
  type OverviewSurfaces,
  type OverviewTask,
  pullVia,
  repoLabel,
  sideThreads,
  sortPulls,
  subagentPaths,
  todoProgress,
} from "./model";
import { parseLocalPull, parsePull, parseTask, valueList } from "./parse";
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

function useResult<T>(result: AsyncResult.AsyncResult<T>): T | undefined {
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

export function OverviewPane({ threadId }: OverviewPaneProps) {
  const orgId = useIssueOrgId();
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
  const refreshChildren = useAtomRefresh(childrenAtom);
  const refreshPulls = useAtomRefresh(pullsAtom);
  const refreshLocalPulls = useAtomRefresh(localPullsAtom);
  const failed =
    AsyncResult.isFailure(children) ||
    AsyncResult.isFailure(pulls) ||
    AsyncResult.isFailure(localPulls);
  const pullRows = useResult(pulls);
  const localPullRows = useResult(localPulls);
  const data = useMemo<OverviewData>(
    () => ({
      jamId: threadId,
      tasks: valueList(children).map(parseTask),
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
      ports: [],
      models: [],
      todos: null,
    }),
    [children, localPullRows, pullRows, threadId],
  );
  const surfaces = useMemo<OverviewSurfaces>(
    () => ({ repos: [], turns: [], machine: null, sessions: undefined }),
    [],
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
            onOpenTab={() => undefined}
            onOpenTask={() => undefined}
            onOpenSideThread={() => undefined}
            onOpenPr={(pull) =>
              void window.open(pull.url, "_blank", "noreferrer")
            }
            onOpenNewTab={() => undefined}
            onCopyUrl={() => undefined}
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
