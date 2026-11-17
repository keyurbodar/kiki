import { createFileRoute } from "@tanstack/react-router";
import { ThisDevicePage } from "@/features/settings-integrations/devices";

export const Route = createFileRoute("/_app/settings/devices_/this")({
  component: ThisDevicePage,
});
