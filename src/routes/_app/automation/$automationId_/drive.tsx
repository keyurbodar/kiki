import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/automation/$automationId_/drive")({
  validateSearch: searchParams(["file"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { automationId } = Route.useParams();
  return (
    <RoutePlaceholder
      title="Drive"
      path={`/automation/${automationId}/drive`}
    />
  );
}
