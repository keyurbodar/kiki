import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/notifications"
      path="/settings/notifications"
    />
  );
}
