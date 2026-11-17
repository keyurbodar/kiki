import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/mcp_/marketplace_/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/mcp/marketplace/$name"
      path="/settings/mcp/marketplace/$name"
    />
  );
}
