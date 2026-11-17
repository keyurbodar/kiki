import { createFileRoute } from "@tanstack/react-router";
import { ProjectDevEnvironmentPage } from "@/features/settings-projects/project-dev-environment-page";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/dev-environment",
)({
  component: ProjectDevEnvironmentPage,
});
