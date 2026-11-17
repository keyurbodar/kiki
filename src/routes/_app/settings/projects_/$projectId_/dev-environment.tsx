import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/dev-environment",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Dev environment"
      path="/settings/projects/$projectId/dev-environment"
    />
  );
}
