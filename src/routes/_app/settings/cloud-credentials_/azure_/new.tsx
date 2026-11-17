import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/azure_/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/cloud-credentials/azure/new"
      path="/settings/cloud-credentials/azure/new"
    />
  );
}
