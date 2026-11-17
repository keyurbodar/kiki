import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/mcp_/plugins/$installationId_/update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/mcp/plugins/$installationId/update"
      path="/settings/mcp/plugins/$installationId/update"
    />
  );
}
