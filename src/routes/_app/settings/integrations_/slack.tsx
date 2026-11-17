import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/integrations_/slack")({
  validateSearch: searchParams(["slack"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/integrations/slack"
      path="/settings/integrations/slack"
    />
  );
}
