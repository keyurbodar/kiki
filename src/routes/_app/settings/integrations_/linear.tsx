import { createFileRoute } from "@tanstack/react-router";
import { LinearIntegrationPage } from "@/features/settings-integrations/integrations";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/integrations_/linear")({
  validateSearch: searchParams(["linear"]),
  component: LinearIntegrationPage,
});
