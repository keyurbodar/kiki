import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-title";
import { searchParams } from "@/lib/search-params";

/**
 * The thread screen is its own chunk: the shell never draws it, and a cold
 * visit should not pay for it. Warming the same module from the loader is what
 * makes `defaultPreload: "intent"` useful here — the router runs the loader on
 * hover, so the chunk is already in hand when the click lands, instead of the
 * hover fetching only this route file and leaving the screen for the click.
 */
const loadThreadScreen = () =>
  import("@/features/thread/thread-route/thread-route");

const ThreadScreenRoute = lazyRouteComponent(
  loadThreadScreen,
  "ThreadScreenRoute",
);

export const Route = createFileRoute("/_app/thread/$threadId")({
  head: () => ({ meta: [{ title: pageTitle("Threads") }] }),
  validateSearch: searchParams(["pane"]),
  loader: loadThreadScreen,
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch();
  return <ThreadScreenRoute threadId={threadId} pane={pane} />;
}
