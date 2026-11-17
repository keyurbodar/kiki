import { createFileRoute } from "@tanstack/react-router";
import { ApiSettingsPage } from "@/features/settings-integrations/api";

export const Route = createFileRoute("/_app/settings/api")({
  component: ApiSettingsPage,
});
