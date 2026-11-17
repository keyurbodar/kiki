import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/threads")({
  validateSearch: searchParams(["automation", "project", "thread"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Threads" path="/threads" />;
}
