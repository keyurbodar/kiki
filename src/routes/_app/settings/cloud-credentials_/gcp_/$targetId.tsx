import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/gcp_/$targetId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/cloud-credentials/gcp/$targetId"
      path="/settings/cloud-credentials/gcp/$targetId"
    />
  );
}
