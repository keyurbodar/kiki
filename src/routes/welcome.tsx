import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/welcome")({
  validateSearch: searchParams(["email", "redirect_url"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Welcome" path="/welcome" />;
}
