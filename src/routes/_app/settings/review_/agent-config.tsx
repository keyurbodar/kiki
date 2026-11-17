import { createFileRoute } from "@tanstack/react-router";
import { ReviewAgentConfigPage } from "@/features/settings-agent/review-page";

export const Route = createFileRoute("/_app/settings/review_/agent-config")({
  component: ReviewAgentConfigPage,
});
