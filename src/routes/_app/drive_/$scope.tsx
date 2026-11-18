import { createFileRoute, notFound } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
import { type DriveMount, driveScopes } from "@/features/drive/lib/mount";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/drive_/$scope")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { scope } = Route.useParams();
  const { file } = Route.useSearch();
  if (!(driveScopes as ReadonlyArray<string>).includes(scope)) throw notFound();
  const mount: DriveMount = {
    kind: "directory",
    scope: scope as "organization" | "personal",
  };
  return <DriveDetailPage mount={mount} file={file} />;
}
