import { createFileRoute } from "@tanstack/react-router";
import { ProjectSetupRepositoryPage } from "@/features/settings-projects/project-setup-repository-page";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/dev-environment_/repositories/$owner/$repo",
)({
  component: ProjectSetupRepositoryPage,
});
