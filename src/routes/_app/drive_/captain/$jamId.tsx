import { createFileRoute } from "@tanstack/react-router";
import { DriveDetailPage } from "@/features/drive/drive-detail-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/drive_/captain/$jamId")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { jamId } = Route.useParams();
  const { file } = Route.useSearch();
  return <DriveDetailPage mount={{ kind: "captain", jamId }} file={file} />;
}
