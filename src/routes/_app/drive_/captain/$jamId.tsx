import { createFileRoute } from "@tanstack/react-router";
import { DriveScopePage } from "@/features/drive/drive-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/drive_/captain/$jamId")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { jamId } = Route.useParams();
  return <DriveScopePage mount={{ kind: "captain", jamId }} />;
}
