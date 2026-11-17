import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/api_/service-user/$serviceUserId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/api/service-user/$serviceUserId"
      path="/settings/api/service-user/$serviceUserId"
    />
  );
}
