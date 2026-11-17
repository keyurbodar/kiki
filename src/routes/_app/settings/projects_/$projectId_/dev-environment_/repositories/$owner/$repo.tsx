import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/dev-environment_/repositories/$owner/$repo",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Repository"
      path="/settings/projects/$projectId/dev-environment/repositories/$owner/$repo"
    />
  );
}
