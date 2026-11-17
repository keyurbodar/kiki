import { createFileRoute } from "@tanstack/react-router";
import { GitHubIntegrationPage } from "@/features/settings-integrations/integrations";

export const Route = createFileRoute("/_app/settings/integrations_/github")({
  component: GitHubIntegrationPage,
});
