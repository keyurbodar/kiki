import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/org/usage")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="/settings/org/usage" path="/settings/org/usage" />
  );
}
