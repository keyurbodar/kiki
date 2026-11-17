import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/git")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/settings/git" path="/settings/git" />;
}
