import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-in/sso-callback")({
  validateSearch: searchParams(["redirect_url"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Sign in" path="/sign-in/sso-callback" />;
}
