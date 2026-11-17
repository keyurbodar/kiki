import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/promotion/$promotionId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Promotion" path="/promotion/$promotionId" />;
}
