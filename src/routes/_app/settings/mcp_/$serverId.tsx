import { createFileRoute } from "@tanstack/react-router";
import { ServerPage } from "@/features/settings-mcp";

export const Route = createFileRoute("/_app/settings/mcp_/$serverId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { serverId } = Route.useParams();
  return <ServerPage mount={{ kind: "settings" }} serverId={serverId} />;
}
