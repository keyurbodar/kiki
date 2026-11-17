import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MobileThreadScreen, useIsNarrow } from "@/features/mobile/thread";
import {
  sampleTimelineRows,
  ThreadView,
  type ThreadTakeoverHandlers,
} from "@/features/thread/thread-view";
import { findPane, panes } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

/** Answers have no transport yet: the thread view still mounts the takeovers. */
const pendingHandlers: ThreadTakeoverHandlers = {
  orgId: undefined,
  parentJamId: null,
  onClarifySubmit: () => undefined,
};

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
  const rows = useMemo(() => sampleTimelineRows(threadId), [threadId]);
  const entry = paneFor(pane);
  return (
    <ThreadView
      threadId={threadId}
      rows={rows}
      handlers={pendingHandlers}
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
