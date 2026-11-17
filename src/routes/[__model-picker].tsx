import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModelPickerPreview } from "@/components/model-picker/preview";

export const Route = createFileRoute("/__model-picker")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ModelPickerPreview,
});
