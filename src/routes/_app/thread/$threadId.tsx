import { useAtomValue } from "@effect/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
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
import { useSideThreads } from "@/features/thread-panes/side-threads";
import { findPane } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

/**
 * Capy opens a thread with its chat alone and drops a `pane` it does not
 * recognise from the URL; a pane the registry has not landed renders nothing
 * rather than guessing at another pane.
 */
const paneFor = (pane: string | undefined) =>
  pane === undefined ? undefined : findPane(pane);

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
  const entry = paneFor(pane);
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
      pane={entry && <entry.component threadId={threadId} />}
      topBar={
        <ThreadHeader
          threadId={threadId}
          title={thread?.title ?? "Untitled thread"}
          tabs={paneTabs()}
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

/** The thread on a wide screen, with the pane search param wired to the router. */
export function ThreadScreen({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  const navigate = useNavigate();
  const known = pane === undefined || findPane(pane) !== undefined;
  useEffect(() => {
    if (known) return;
    void navigate({
      to: "/thread/$threadId",
      params: { threadId },
      search: {},
      replace: true,
    });
  }, [known, navigate, threadId]);
  return (
    <ThreadRoute
      threadId={threadId}
      pane={pane}
      onSelectPane={(next) =>
        void navigate({
          to: "/thread/$threadId",
          params: { threadId },
          search: next === undefined ? {} : { pane: next },
        })
      }
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
