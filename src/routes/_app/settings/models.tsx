import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/features/settings-models/models-page";

export const Route = createFileRoute("/_app/settings/models")({
  component: ModelsPage,
});
