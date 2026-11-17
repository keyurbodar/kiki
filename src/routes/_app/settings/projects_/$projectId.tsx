import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/features/settings-projects/project-page";

export const Route = createFileRoute("/_app/settings/projects_/$projectId")({
  component: ProjectPage,
});
