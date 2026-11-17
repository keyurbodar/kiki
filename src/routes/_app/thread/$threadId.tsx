import { useAtomValue } from "@effect/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { MobileThreadScreen, useIsNarrow } from "@/features/mobile/thread";
import {
  type ThreadTakeoverHandlers,
  ThreadView,
} from "@/features/thread/thread-view";
import { useThreadTimeline } from "@/features/thread/timeline";
import { findPane, panes } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

/** Capy opens a thread on its first tab (Overview); a pane that has not landed yet falls back to the first one registered. */
const DEFAULT_PANE = "overview";

const paneFor = (pane: string | undefined) =>
  pane === undefined ? (findPane(DEFAULT_PANE) ?? panes[0]) : findPane(pane);

export function ThreadRoute({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const timeline = useThreadTimeline((orgId ?? "") as OrgId, threadId as JamId);
  const handlers = useMemo<ThreadTakeoverHandlers>(
    () => ({
      orgId,
      parentJamId: null,
      onClarifySubmit: () => undefined,
    }),
    [orgId],
  );
  const entry = paneFor(pane);
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
      pane={entry && <entry.component threadId={threadId} />}
    />
  );
}

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileThreadScreen threadId={threadId} />;
  return <ThreadRoute threadId={threadId} pane={pane} />;
}
