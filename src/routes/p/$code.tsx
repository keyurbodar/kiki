import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/p/$code")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Promotion" path="/p/$code" />;
}
