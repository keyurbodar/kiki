import { createFileRoute } from "@tanstack/react-router";
import { SlackLinkPage } from "@/features/onboarding/account-link";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/slack/link")({
  validateSearch: searchParams(["token"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <SlackLinkPage token={token} />;
}
