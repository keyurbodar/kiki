import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/automation/$automationId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="Automation" path="/automation/$automationId" />
  );
}
