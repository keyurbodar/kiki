import { createFileRoute } from "@tanstack/react-router";
import { SettingsNotificationsDevicePage } from "@/features/settings-notifications/notification-devices";

export const Route = createFileRoute("/_app/settings/notifications_/device")({
  component: SettingsNotificationsDevicePage,
});
