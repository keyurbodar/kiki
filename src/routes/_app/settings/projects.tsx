import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="Projects & setup" path="/settings/projects" />
  );
}
