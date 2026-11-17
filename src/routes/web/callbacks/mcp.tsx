import { createFileRoute } from "@tanstack/react-router";
import { McpCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/mcp")({
  validateSearch: searchParams(["code", "error", "iss", "state"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <McpCallback input={search} />;
}
