import { createFileRoute } from "@tanstack/react-router";
import { XCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/x")({
  validateSearch: searchParams(["code", "error", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <XCallback input={search} />;
}
