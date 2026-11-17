import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/security/not-me")({
  validateSearch: searchParams(["token"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="Report a sign-in change" path="/security/not-me" />
  );
}
