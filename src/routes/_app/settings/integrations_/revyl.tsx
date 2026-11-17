import { createFileRoute } from "@tanstack/react-router";
import { RevylIntegrationPage } from "@/features/settings-integrations/integrations";

export const Route = createFileRoute("/_app/settings/integrations_/revyl")({
  component: RevylIntegrationPage,
});
