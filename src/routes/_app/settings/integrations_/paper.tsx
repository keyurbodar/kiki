import { createFileRoute } from "@tanstack/react-router";
import { PaperIntegrationPage } from "@/features/settings-integrations/integrations";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/integrations_/paper")({
  validateSearch: searchParams(["paper"]),
  component: PaperIntegrationPage,
});
