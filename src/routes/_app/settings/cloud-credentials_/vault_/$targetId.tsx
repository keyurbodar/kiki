import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/vault_/$targetId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/cloud-credentials/vault/$targetId"
      path="/settings/cloud-credentials/vault/$targetId"
    />
  );
}
