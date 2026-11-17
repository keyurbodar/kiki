import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/github")({
  validateSearch: searchParams([
    "code",
    "error",
    "installation_id",
    "setup_action",
    "state",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/web/callbacks/github"
      path="/web/callbacks/github"
    />
  );
}
