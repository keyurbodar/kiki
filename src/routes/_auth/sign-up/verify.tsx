import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-up/verify")({
  validateSearch: searchParams(["status"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Sign up" path="/sign-up/verify" />;
}
