import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/issues")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Issues" path="/issues" />;
}
