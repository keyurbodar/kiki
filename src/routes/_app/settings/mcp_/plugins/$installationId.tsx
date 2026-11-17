import { createFileRoute } from "@tanstack/react-router";
import { PluginPage } from "@/features/settings-mcp";

export const Route = createFileRoute(
  "/_app/settings/mcp_/plugins/$installationId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { installationId } = Route.useParams();
  return <PluginPage installationId={installationId} />;
}
