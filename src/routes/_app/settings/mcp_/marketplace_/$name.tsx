import { createFileRoute } from "@tanstack/react-router";
import { PluginAddPage } from "@/features/settings-mcp";

export const Route = createFileRoute("/_app/settings/mcp_/marketplace_/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = Route.useParams();
  return <PluginAddPage name={name} />;
}
