import { createFileRoute } from "@tanstack/react-router";
import { ProjectsListPage } from "@/features/settings-projects/projects-list";

export const Route = createFileRoute("/_app/settings/projects")({
  component: ProjectsListPage,
});
