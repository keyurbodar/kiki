import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/new")({
  validateSearch: searchParams(["prompt"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Capy" path="/new" />;
}
