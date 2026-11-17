import { createFileRoute } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
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
  const { projectId, scope } = Route.useParams();
  const { file } = Route.useSearch();
  return (
    <DriveDetailPage
      mount={{
        kind: "project",
        projectId,
        scope: scope === "personal" ? "personal" : "shared",
      }}
      file={file}
    />
  );
}
