import { createFileRoute } from "@tanstack/react-router";
import { CloudSetupPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/azure_/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <CloudSetupPage provider="azure" />;
}
