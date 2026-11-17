import { createFileRoute } from "@tanstack/react-router";
import { ApiKeyDetailPage } from "@/features/settings-integrations/api";

export const Route = createFileRoute("/_app/settings/api_/key/$keyId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { keyId } = Route.useParams();
  return <ApiKeyDetailPage key={keyId} keyId={keyId} />;
}
