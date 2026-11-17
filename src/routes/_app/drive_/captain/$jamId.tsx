import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/drive_/captain/$jamId")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Drive" path="/drive/captain/$jamId" />;
}
