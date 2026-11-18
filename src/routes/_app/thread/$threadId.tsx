import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { searchParams } from "@/lib/search-params";

const ThreadScreenRoute = lazyRouteComponent(
  () => import("@/features/thread/thread-route/thread-route"),
  "ThreadScreenRoute",
);

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  return <ThreadScreenRoute threadId={threadId} pane={pane} />;
}
