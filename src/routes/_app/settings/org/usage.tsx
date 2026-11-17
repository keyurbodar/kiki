import { createFileRoute } from "@tanstack/react-router";
import { SettingsOrgUsagePage } from "@/features/settings-org/org-usage-page";

export const Route = createFileRoute("/_app/settings/org/usage")({
  component: SettingsOrgUsagePage,
});
