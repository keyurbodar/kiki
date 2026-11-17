import { createFileRoute } from "@tanstack/react-router";
import { LinearLinkPage } from "@/features/onboarding/account-link";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/linear/link")({
  validateSearch: searchParams(["token"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <LinearLinkPage token={token} />;
}
