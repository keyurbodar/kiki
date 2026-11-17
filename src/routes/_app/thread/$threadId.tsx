import { useAtomValue } from "@effect/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useCallback, useEffect, useMemo, useState } from "react";
import { copyText } from "@/components/file-view/copy";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
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
import {
  activeTabId,
  paneTabs,
  ThreadHeader,
  type ThreadTakeoverHandlers,
  ThreadView,
} from "@/features/thread/thread-view";
import { useThreadTimeline } from "@/features/thread/timeline";
import { findPane, findPaneByParam } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

/** The pane id a `pane` param opens, and undefined for a value Capy drops. */
export const paneIdForParam = (pane: string | undefined) =>
  findPaneByParam(pane)?.id;

export type ThreadRouteProps = {
  threadId: string;
  /** The pane to open, by registry id; the route resolves it from the URL. */
  pane: string | undefined;
  /** Clears the pane param when the open pane closes, as Capy's close does. */
  onPaneClosed?: () => void;
};

export function ThreadRoute({
  threadId,
  pane,
  onPaneClosed,
}: ThreadRouteProps) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const timeline = useThreadTimeline((orgId ?? "") as OrgId, threadId as JamId);
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
  const [paneId, setPaneId] = useState(pane);
  useEffect(() => setPaneId(pane), [pane]);
  const entry = findPane(paneId);
  const activeId = activeTabId(entry);
  const closePane = () => {
    setPaneId(undefined);
    onPaneClosed?.();
  };
  const [expanded, setExpanded] = useState(false);
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
      pane={entry && <entry.component threadId={threadId} />}
      topBar={
        <ThreadHeader
          threadId={threadId}
          title={thread?.title ?? "Untitled thread"}
          tabs={paneTabs()}
          activeId={activeId}
          cost={
            orgId === undefined ? undefined : (
              <ThreadCostBadge orgId={orgId} jamId={threadId} />
            )
          }
          expanded={expanded}
          onSelectChat={closePane}
          onSelectTab={setPaneId}
          onCloseTab={(id) => {
            if (id === activeId) closePane();
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

/** The thread on a wide screen, with the pane the route's param opened. */
export function ThreadScreen({
  threadId,
  pane,
  onPaneClosed,
}: {
  threadId: string;
  pane: string | undefined;
  onPaneClosed?: () => void;
}) {
  return (
    <ThreadRoute threadId={threadId} pane={pane} onPaneClosed={onPaneClosed} />
  );
}

/**
 * Capy honours `?pane=overview` and `?pane=diffs` and drops every other value,
 * so a param outside the registry's addressable set is stripped from the URL
 * and the thread opens on its chat. Every other pane opens from the tab strip
 * or the + menu and never reaches the URL.
 */
function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  const navigate = useNavigate();
  const paneId = paneIdForParam(pane);
  const clearParam = useCallback(() => {
    void navigate({
      to: "/thread/$threadId",
      params: { threadId },
      search: {},
      replace: true,
    });
  }, [navigate, threadId]);
  useEffect(() => {
    if (pane !== undefined && paneId === undefined) clearParam();
  }, [pane, paneId, clearParam]);
  const isPhoneSurface = useIsPhoneSurface();
  if (isPhoneSurface) return <MobileThreadScreen threadId={threadId} />;
  return (
    <ThreadScreen
      threadId={threadId}
      pane={paneId}
      onPaneClosed={() => {
        if (pane !== undefined) clearParam();
      }}
    />
  );
}
