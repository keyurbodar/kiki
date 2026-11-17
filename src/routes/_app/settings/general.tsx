import { createFileRoute } from "@tanstack/react-router";
import { GeneralPage } from "@/features/settings/general-page";

export const Route = createFileRoute("/_app/settings/general")({
  component: GeneralPage,
});
