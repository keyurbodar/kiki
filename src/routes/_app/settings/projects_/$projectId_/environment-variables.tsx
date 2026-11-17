import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/environment-variables",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Environment variables"
      path="/settings/projects/$projectId/environment-variables"
    />
  );
}
