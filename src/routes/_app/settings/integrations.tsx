import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/integrations")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/integrations"
      path="/settings/integrations"
    />
  );
}
