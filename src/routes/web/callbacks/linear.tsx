import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/web/callbacks/linear")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/web/callbacks/linear"
      path="/web/callbacks/linear"
    />
  );
}
