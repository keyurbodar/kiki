import { createFileRoute } from "@tanstack/react-router";
import { CloudSetupPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/oidc_/$targetId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { targetId } = Route.useParams();
  return <CloudSetupPage provider="oidc" targetId={targetId} />;
}
