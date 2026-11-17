import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/diagram/$threadId/$messageId/$index",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="Diagram"
      path="/diagram/$threadId/$messageId/$index"
    />
  );
}
