import { createFileRoute } from "@tanstack/react-router";
import { TailscaleIntegrationPage } from "@/features/settings-integrations/integrations";

export const Route = createFileRoute("/_app/settings/integrations_/tailscale")({
  component: TailscaleIntegrationPage,
});
