import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { MobileThreadScreen, useIsNarrow } from "@/features/mobile/thread";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId } = Route.useParams();
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileThreadScreen threadId={threadId} />;
  return <RoutePlaceholder title="Threads" path="/thread/$threadId" />;
}
