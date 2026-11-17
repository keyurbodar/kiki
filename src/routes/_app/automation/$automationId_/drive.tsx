import { createFileRoute } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/automation/$automationId_/drive")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { automationId } = Route.useParams();
  const { file } = Route.useSearch();
  return (
    <DriveDetailPage mount={{ kind: "automation", automationId }} file={file} />
  );
}
