import { createFileRoute } from "@tanstack/react-router";
import { BuildDetailPage } from "@/features/settings-projects/build-detail-page";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/dev-environment_/builds/$buildId",
)({
  component: BuildDetailPage,
});
