import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/settings/notifications_/device")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Turn off new sign-in alerts?"
      path="/settings/notifications/device"
    />
  );
}
