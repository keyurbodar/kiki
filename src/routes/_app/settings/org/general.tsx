import { createFileRoute } from "@tanstack/react-router";
import { SettingsOrgGeneralPage } from "@/features/settings-org/org-general-page";

export const Route = createFileRoute("/_app/settings/org/general")({
  component: SettingsOrgGeneralPage,
});
