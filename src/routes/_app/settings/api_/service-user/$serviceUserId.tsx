import { createFileRoute } from "@tanstack/react-router";
import { ServiceUserDetailPage } from "@/features/settings-integrations/api";

export const Route = createFileRoute(
  "/_app/settings/api_/service-user/$serviceUserId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { serviceUserId } = Route.useParams();
  return (
    <ServiceUserDetailPage key={serviceUserId} serviceUserId={serviceUserId} />
  );
}
