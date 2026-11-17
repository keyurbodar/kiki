import { createFileRoute } from "@tanstack/react-router";
import { SettingsIssueStatesPage } from "@/features/settings-org/issue-states-page";

export const Route = createFileRoute("/_app/settings/org/issue-states")({
  component: SettingsIssueStatesPage,
});
