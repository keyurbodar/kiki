import { createFileRoute } from "@tanstack/react-router";
import { ThreadsSettingsPage } from "@/features/settings-agent/threads";

export const Route = createFileRoute("/_app/settings/threads")({
  component: ThreadsSettingsPage,
});
