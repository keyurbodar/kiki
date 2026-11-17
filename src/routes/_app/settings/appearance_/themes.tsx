import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/appearance_/themes")({
  validateSearch: searchParams(["page"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/appearance/themes"
      path="/settings/appearance/themes"
    />
  );
}
