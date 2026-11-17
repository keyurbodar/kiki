import { createFileRoute } from "@tanstack/react-router";
import { PaperCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/paper")({
  validateSearch: searchParams(["code", "error", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <PaperCallback input={search} />;
}
