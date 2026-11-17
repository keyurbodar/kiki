import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MobileThreadScreen, useIsNarrow } from "@/features/mobile/thread";
import { sampleTimelineRows, ThreadView } from "@/features/thread/thread-view";
import { findPane } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  const isNarrow = useIsNarrow();
  const rows = useMemo(() => sampleTimelineRows(), []);
  const entry = findPane(pane);
  if (isNarrow) return <MobileThreadScreen threadId={threadId} />;
  return (
    <ThreadView
      threadId={threadId}
      rows={rows}
      pane={entry && <entry.component threadId={threadId} />}
    />
  );
}
