import { createFileRoute, notFound } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
import type { DriveMount } from "@/features/drive/lib/mount";
import { searchParams } from "@/lib/search-params";

const projectScopes = ["shared", "personal"] as const;

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
  if (!(projectScopes as ReadonlyArray<string>).includes(scope))
    throw notFound();
  const mount: DriveMount = {
    kind: "project",
    projectId,
    scope: scope as "shared" | "personal",
  };
  return <DriveDetailPage mount={mount} file={file} />;
}
