import { createFileRoute } from "@tanstack/react-router";
import { ProviderListPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute("/_app/settings/cloud-credentials_/gcp")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProviderListPage provider="gcp" />;
}
