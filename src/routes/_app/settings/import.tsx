import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/import")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/settings/import" path="/settings/import" />;
}
