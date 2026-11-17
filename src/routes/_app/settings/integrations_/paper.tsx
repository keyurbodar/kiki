import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/integrations_/paper")({
  validateSearch: searchParams(["paper"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/integrations/paper"
      path="/settings/integrations/paper"
    />
  );
}
