import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/_app/issues_/$code")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Issues" path="/issues/$code" />;
}
