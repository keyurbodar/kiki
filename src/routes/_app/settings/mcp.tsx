import { createFileRoute } from "@tanstack/react-router";
import { McpAndPluginsPage } from "@/features/settings-mcp";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/mcp")({
  validateSearch: searchParams(["github", "mcp"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { github } = Route.useSearch();
  return <McpAndPluginsPage github={github} />;
}
