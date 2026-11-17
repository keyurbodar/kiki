import { createFileRoute } from "@tanstack/react-router";
import { ShareFile } from "@/components/share-file";

export const Route = createFileRoute("/_app/drive_/share/$shareId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { shareId } = Route.useParams();
  return <ShareFile key={shareId} shareId={shareId} inApp />;
}
