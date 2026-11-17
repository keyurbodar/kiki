import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute("/email/$program")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Email" path="/email/$program" />;
}
