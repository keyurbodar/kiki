import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/mcp_/add/$versionId")({
  validateSearch: searchParams(["ref"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/mcp/add/$versionId"
      path="/settings/mcp/add/$versionId"
    />
  );
}
