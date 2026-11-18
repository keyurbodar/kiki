import { createFileRoute } from "@tanstack/react-router";
import { ShareFile } from "@/components/share-file";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/s/$shareId")({
  validateSearch: searchParams(["view"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { shareId } = Route.useParams();
  const { view } = Route.useSearch();
  return (
    <ShareFile key={shareId} shareId={shareId} preview={view === "share"} />
  );
}
