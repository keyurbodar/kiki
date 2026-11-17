import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/not-found-page";

export const Route = createFileRoute("/_app/settings/import")({
  component: NotFoundPage,
});
