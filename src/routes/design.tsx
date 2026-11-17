import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/design")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Design" path="/design" />;
}
