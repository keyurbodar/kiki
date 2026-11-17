import { createFileRoute } from "@tanstack/react-router";
import { GitSettingsPage } from "@/features/settings-agent/git";

export const Route = createFileRoute("/_app/settings/git")({
  component: GitSettingsPage,
});
