import { createFileRoute } from "@tanstack/react-router";
import { ShortcutsPage } from "@/features/settings/shortcuts-page";

export const Route = createFileRoute("/_app/settings/shortcuts")({
  component: ShortcutsPage,
});
