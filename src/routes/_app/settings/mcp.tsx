import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/mcp")({
  validateSearch: searchParams(["github", "mcp"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/settings/mcp" path="/settings/mcp" />;
}
