import { createFileRoute } from "@tanstack/react-router";
import { ProjectEnvironmentPage } from "@/features/settings-projects/project-environment-page";

export const Route = createFileRoute(
  "/_app/settings/projects_/$projectId_/environment-variables",
)({ component: ProjectEnvironmentPage });
