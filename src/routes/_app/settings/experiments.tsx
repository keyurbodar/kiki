import { createFileRoute } from "@tanstack/react-router";
import { ExperimentsPage } from "@/features/settings/experiments-page";

export const Route = createFileRoute("/_app/settings/experiments")({
  component: ExperimentsPage,
});
