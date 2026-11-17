import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-in/verify")({
  validateSearch: searchParams(["status"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Sign in" path="/sign-in/verify" />;
}
