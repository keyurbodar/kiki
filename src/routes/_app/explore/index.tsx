import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/explore/")({
  validateSearch: searchParams(["q"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Explore" path="/explore" />;
}
