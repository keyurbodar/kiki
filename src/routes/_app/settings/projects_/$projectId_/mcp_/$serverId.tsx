import { createFileRoute } from "@tanstack/react-router";
import { ServerPage } from "@/features/settings-mcp";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/mcp_/$serverId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId, serverId } = Route.useParams();
  return (
    <ServerPage mount={{ kind: "project", projectId }} serverId={serverId} />
  );
}
