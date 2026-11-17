import { createFileRoute } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/drive_/$scope")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { scope } = Route.useParams();
  const { file } = Route.useSearch();
  return (
    <DriveDetailPage
      mount={{
        kind: "directory",
        scope: scope === "organization" ? "organization" : "personal",
      }}
      file={file}
    />
  );
}
