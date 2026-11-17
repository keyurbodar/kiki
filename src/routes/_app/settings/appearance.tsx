import { createFileRoute } from "@tanstack/react-router";
import { AppearancePage } from "@/features/settings-appearance/appearance-page";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: AppearancePage,
});
