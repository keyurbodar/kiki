import { createFileRoute } from "@tanstack/react-router";
import { LinearCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/linear")({
  validateSearch: searchParams(["code", "error", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <LinearCallback input={search} />;
}
