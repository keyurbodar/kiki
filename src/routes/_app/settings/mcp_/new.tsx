import { createFileRoute } from "@tanstack/react-router";
import { NewServerPage } from "@/features/settings-mcp";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/mcp_/new")({
  validateSearch: searchParams(["import"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <NewServerPage
      mount={{ kind: "settings" }}
      importing={search.import === "true"}
    />
  );
}
