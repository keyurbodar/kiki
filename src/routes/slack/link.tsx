import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/slack/link")({
  validateSearch: searchParams(["token"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="/slack/link" path="/slack/link" />;
}
