import { createFileRoute, useLocation } from "@tanstack/react-router";
import {
  DevicesPage,
  pairingCodeFromHash,
} from "@/features/settings-integrations/devices";

export const Route = createFileRoute("/_app/settings/devices_/link")({
  component: RouteComponent,
});

function RouteComponent() {
  const hash = useLocation({ select: (location) => location.hash });
  return <DevicesPage pair={{ code: pairingCodeFromHash(hash) }} />;
}
