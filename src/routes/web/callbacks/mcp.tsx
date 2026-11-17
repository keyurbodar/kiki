import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/mcp")({
  validateSearch: searchParams(["code", "error", "iss", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="/web/callbacks/mcp" path="/web/callbacks/mcp" />
  );
}
