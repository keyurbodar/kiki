import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/projects_/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="Project" path="/settings/projects/$projectId" />
  );
}
