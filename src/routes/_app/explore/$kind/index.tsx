import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/explore/$kind/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/explore/$kind" path="/explore/$kind" />;
}
