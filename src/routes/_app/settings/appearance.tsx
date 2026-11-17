import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="General" path="/settings/appearance" />;
}
