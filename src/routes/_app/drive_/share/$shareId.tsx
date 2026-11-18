import { createFileRoute } from "@tanstack/react-router";
import { ShareFile } from "@/components/share-file";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/drive_/share/$shareId")({
  head: () => ({ meta: [{ title: pageTitle("Shared file") }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { shareId } = Route.useParams();
  return <ShareFile key={shareId} shareId={shareId} inApp />;
}
