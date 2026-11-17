import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsPage } from "@/features/settings-integrations/integrations";

export const Route = createFileRoute("/_app/settings/integrations")({
  component: IntegrationsPage,
});
