import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/pulls")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Pull requests" path="/pulls" />;
}
