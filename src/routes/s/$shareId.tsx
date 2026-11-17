import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/s/$shareId")({
  validateSearch: searchParams(["view"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Shared file" path="/s/$shareId" />;
}
