import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/$")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Page not found" path="/$" />;
}
