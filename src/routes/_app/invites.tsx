import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/invites")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Invites" path="/invites" />;
}
