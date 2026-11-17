import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/shortcuts")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="/settings/shortcuts" path="/settings/shortcuts" />
  );
}
