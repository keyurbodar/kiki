import { createFileRoute } from "@tanstack/react-router";
import { CloudSetupPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/gcp_/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <CloudSetupPage provider="gcp" />;
}
