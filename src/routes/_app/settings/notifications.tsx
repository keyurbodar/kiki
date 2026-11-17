import { createFileRoute } from "@tanstack/react-router";
import { SettingsNotificationsPage } from "@/features/settings-notifications/notifications-page";

export const Route = createFileRoute("/_app/settings/notifications")({
  component: SettingsNotificationsPage,
});
