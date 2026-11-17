import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/offer/$offerId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Partner credits" path="/offer/$offerId" />;
}
