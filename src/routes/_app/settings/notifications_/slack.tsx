import { createFileRoute } from "@tanstack/react-router";
import { SettingsNotificationsSlackPage } from "@/features/settings-notifications/notifications-slack-page";

export const Route = createFileRoute("/_app/settings/notifications_/slack")({
  component: SettingsNotificationsSlackPage,
});
