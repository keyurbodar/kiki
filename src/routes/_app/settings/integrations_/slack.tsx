import { createFileRoute } from "@tanstack/react-router";
import { SlackIntegrationPage } from "@/features/settings-integrations/integrations";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/integrations_/slack")({
  validateSearch: searchParams(["slack"]),
  component: SlackIntegrationPage,
});
