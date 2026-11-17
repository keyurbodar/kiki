import { createFileRoute } from "@tanstack/react-router";
import { GeneralPage } from "@/features/settings/general";

export const Route = createFileRoute("/_app/settings/general")({
  component: GeneralPage,
});
