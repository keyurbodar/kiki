import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/project/$projectId/drive/$scope")({
  validateSearch: searchParams([
    "file",
    "pane",
    "panel",
    "pr",
    "repo",
    "repoFullName",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder title="Drive" path="/project/$projectId/drive/$scope" />
  );
}
