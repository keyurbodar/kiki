import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/automation/new")({
  validateSearch: searchParams(["template", "thread"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="New automation" path="/automation/new" />;
}
