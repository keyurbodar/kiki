import { createFileRoute } from "@tanstack/react-router";
import { PluginAddPage } from "@/features/settings-mcp";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/mcp_/add/$versionId")({
  validateSearch: searchParams(["ref"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { versionId } = Route.useParams();
  const { ref } = Route.useSearch();
  return <PluginAddPage versionId={versionId} sourceRef={ref} />;
}
