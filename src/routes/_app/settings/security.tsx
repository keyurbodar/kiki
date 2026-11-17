import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/security")({
  validateSearch: searchParams(["passkey"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="/settings/security" path="/settings/security" />
  );
}
