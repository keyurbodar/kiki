import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/memory")({
  validateSearch: searchParams(["file", "volume", "where", "who"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Memory" path="/memory" />;
}
