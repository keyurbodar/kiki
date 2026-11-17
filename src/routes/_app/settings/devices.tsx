import { createFileRoute } from "@tanstack/react-router";
import { DevicesPage } from "@/features/settings-integrations/devices";

export const Route = createFileRoute("/_app/settings/devices")({
  component: DevicesPage,
});
