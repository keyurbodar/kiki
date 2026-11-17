import { createFileRoute } from "@tanstack/react-router";
import { DeviceDetailPage } from "@/features/settings-integrations/devices";

export const Route = createFileRoute("/_app/settings/devices_/$deviceId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deviceId } = Route.useParams();
  return <DeviceDetailPage deviceId={deviceId} />;
}
