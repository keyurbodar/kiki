import { createFileRoute } from "@tanstack/react-router";
import { NewServerPage } from "@/features/settings-mcp";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/mcp_/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <NewServerPage mount={{ kind: "project", projectId }} />;
}
