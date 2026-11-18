import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import { copyText } from "@/components/file-view/copy";
import type { EventId, JamId, OrgId } from "@/data/api/schemas/ids";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { threadsAtom } from "@/data/atoms/threads";
import {
  MobileThreadScreen,
  useIsPhoneSurface,
} from "@/features/mobile/thread";
import { ThreadCostBadge } from "@/features/thread/cost-badge";
import type { EditTarget } from "@/features/thread/message-footer";
import {
  activeTabId,
  dockTabs,
  mainTabs,
  ThreadHeader,
  type ThreadTakeoverHandlers,
  ThreadView,
} from "@/features/thread/thread-view";
import {
  editDraftAtom,
  threadKey,
  useThreadTimeline,
} from "@/features/thread/timeline";
import { useSideThreads } from "@/features/thread-panes/side-threads";
import { tabKey } from "@/features/thread-panes/tab-strip";
import { ThreadDock } from "@/features/thread-panes/thread-dock";
import {
  findPane,
  keepsPaneParam,
  surfaceOf,
} from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

export type ThreadRouteProps = {
  threadId: string;
  pane: string | undefined;
  /** The route's pane search param; undefined returns the thread to its chat. */
  onSelectPane?: (pane: string | undefined) => void;
};

export function ThreadRoute({
  threadId,
  pane,
  onSelectPane,
}: ThreadRouteProps) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const timeline = useThreadTimeline((orgId ?? "") as OrgId, threadId as JamId);
  const editKey = threadKey((orgId ?? "") as OrgId, threadId as JamId);
  const editing = useAtomValue(editDraftAtom(editKey));
  const setEditing = useAtomSet(editDraftAtom(editKey));
  const startEdit = (target: EditTarget) =>
    setEditing({ ...target, eventId: target.eventId as EventId });
  const stopEdit = () => setEditing(null);
  useEffect(() => {
    if (editing === null) return;
    if (
      timeline.rows.some(
        (row) => row.type === "user-message" && row.editOf === editing.eventId,
      )
    )
      setEditing(null);
  }, [editing, setEditing, timeline.rows]);
  const listed = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(threadsAtom((orgId ?? "") as OrgId))),
  );
  const thread = listed?.items.find((card) => card.id === threadId);
  const handlers = useMemo<ThreadTakeoverHandlers>(
    () => ({
      orgId,
      parentJamId: null,
      onClarifySubmit: () => undefined,
    }),
    [orgId],
  );
  const [expanded, setExpanded] = useState(false);
  const sideThreads = useSideThreads(orgId ?? "", threadId);
  const entry = findPane(pane);
  const activeId = activeTabId(entry);
  return (
    <ThreadView
      threadId={threadId}
      rows={timeline.rows}
      loading={timeline.loading}
      loadingOlder={timeline.loadingOlder}
      hasOlder={timeline.hasOlder}
      onLoadOlder={timeline.loadOlder}
      pendingAsk={timeline.pendingAsk}
      pendingEnvironment={timeline.pendingEnvironment}
      handlers={handlers}
      paneExpanded={expanded}
      editing={editing}
      onEditMessage={startEdit}
      onCancelEdit={stopEdit}
      mainPane={
        entry !== undefined && surfaceOf(entry) === "main" ? (
          <entry.component threadId={threadId} />
        ) : undefined
      }
      dock={
        entry !== undefined && surfaceOf(entry) === "dock" ? (
          <ThreadDock
            threadId={threadId}
            tabs={dockTabs()}
            activeId={
              entry !== undefined && surfaceOf(entry) === "dock" ? activeId : ""
            }
            title={thread?.title ?? "Untitled thread"}
            menu={{ sideThreads }}
            expanded={expanded}
            onSelectTab={(id) => onSelectPane?.(id)}
            onOpenTab={(tab) => onSelectPane?.(tabKey(tab))}
            onCloseTab={(id) => {
              if (id === activeId) onSelectPane?.(undefined);
            }}
            onClose={() => onSelectPane?.(undefined)}
            onToggleExpand={() => setExpanded((current) => !current)}
            onCopyLink={(path) =>
              void copyText(
                `${window.location.origin}${path}`,
                "Link copied",
                "Could not copy link",
              )
            }
          >
            <entry.component threadId={threadId} />
          </ThreadDock>
        ) : undefined
      }
      topBar={
        <ThreadHeader
          threadId={threadId}
          title={thread?.title ?? "Untitled thread"}
          working={thread?.status === "working"}
          tabs={mainTabs()}
          activeId={activeId}
          menu={{ sideThreads }}
          cost={
            orgId === undefined ? undefined : (
              <ThreadCostBadge orgId={orgId} jamId={threadId} />
            )
          }
          expanded={expanded}
          onSelectChat={() => onSelectPane?.(undefined)}
          onSelectTab={(id) => onSelectPane?.(id)}
          onCloseTab={(id) => {
            if (id === activeId) onSelectPane?.(undefined);
          }}
          onCopyLink={(path) =>
            void copyText(
              `${window.location.origin}${path}`,
              "Link copied",
              "Could not copy link",
            )
          }
          onToggleExpand={() => setExpanded((current) => !current)}
        />
      }
    />
  );
}

/**
 * The thread on a wide screen. The URL seeds the open pane once, and picking a
 * pane keeps the URL in step with Capy's vocabulary: `overview`, `diffs` and
 * `captain_issues` are written, `files` opens without a param, and a value we
 * cannot open is rewritten off the URL. Entering a thread seeds from its URL, so
 * a pane opened from a tab does not follow you back into the thread: with a
 * clean URL Capy lands on the chat there too.
 */
export function ThreadScreen({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  return <PaneSelection key={threadId} threadId={threadId} pane={pane} />;
}

function PaneSelection({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  const navigate = useNavigate();
  const [selection, setSelection] = useState(() => ({
    threadId,
    param: pane,
    id: findPane(pane)?.id,
  }));
  const active =
    selection.threadId === threadId && selection.param === pane
      ? selection.id
      : findPane(pane)?.id;
  const stray = pane !== undefined && !keepsPaneParam(pane);
  useEffect(() => {
    if (!stray) return;
    setSelection({ threadId, param: undefined, id: findPane(pane)?.id });
    void navigate({
      to: "/thread/$threadId",
      params: { threadId },
      search: {},
      replace: true,
    });
  }, [stray, navigate, pane, threadId]);
  return (
    <ThreadRoute
      threadId={threadId}
      pane={active}
      onSelectPane={(next) => {
        setSelection({
          threadId,
          param: next !== undefined && keepsPaneParam(next) ? next : undefined,
          id: next,
        });
        if (next === undefined && pane === undefined) return;
        void navigate({
          to: "/thread/$threadId",
          params: { threadId },
          search:
            next !== undefined && keepsPaneParam(next) ? { pane: next } : {},
        });
      }}
    />
  );
}

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  const isPhoneSurface = useIsPhoneSurface();
  if (isPhoneSurface) return <MobileThreadScreen threadId={threadId} />;
  return <ThreadScreen threadId={threadId} pane={pane} />;
}
