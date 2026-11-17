import { createFileRoute } from "@tanstack/react-router";
import { ReviewRepositoriesPage } from "@/features/settings-agent/review-page";

export const Route = createFileRoute("/_app/settings/review_/repositories")({
  component: ReviewRepositoriesPage,
});
