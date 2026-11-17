import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/vm-handoff")({
  validateSearch: searchParams([
    "jamId",
    "jam_id",
    "machineId",
    "machine_id",
    "port",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const threadId = search.jamId ?? search.jam_id;
  if (threadId) {
    return <Navigate to="/thread/$threadId" params={{ threadId }} replace />;
  }
  return <RoutePlaceholder title="Opening preview" path="/vm-handoff" />;
}
