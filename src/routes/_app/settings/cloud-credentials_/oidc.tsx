import { createFileRoute } from "@tanstack/react-router";
import { OidcListPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute("/_app/settings/cloud-credentials_/oidc")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OidcListPage />;
}
