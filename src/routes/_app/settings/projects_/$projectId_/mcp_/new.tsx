import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/mcp_/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="MCP server"
      path="/settings/projects/$projectId/mcp/new"
    />
  );
}
