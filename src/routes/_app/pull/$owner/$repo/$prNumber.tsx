import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/pull/$owner/$repo/$prNumber")({
  validateSearch: searchParams(["chat", "org", "tab", "thread"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Pull requests"
      path="/pull/$owner/$repo/$prNumber"
    />
  );
}
