import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/drive_/shared")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Shared" path="/drive/shared" />;
}
