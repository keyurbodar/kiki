import { createFileRoute } from "@tanstack/react-router";
import { SlackCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/slack")({
  validateSearch: searchParams(["code", "error", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <SlackCallback input={search} />;
}
