import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/x")({
  validateSearch: searchParams(["code", "error", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/web/callbacks/x" path="/web/callbacks/x" />;
}
