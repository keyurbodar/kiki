import { createFileRoute } from "@tanstack/react-router";
import { PluginUpdatePage } from "@/features/settings-mcp";

export const Route = createFileRoute(
  "/_app/settings/mcp_/plugins/$installationId_/update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { installationId } = Route.useParams();
  return <PluginUpdatePage installationId={installationId} />;
}
