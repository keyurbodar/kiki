import type { Project } from "@/data/api/schemas/project";

export const welcomeProjectLimit = 4;

export const welcomeActionLabel = (projectless: boolean) =>
  projectless ? "Start without a project" : "Start without a repository";

export const visibleWelcomeProjects = (
  projects: ReadonlyArray<Project>,
  limit: number = welcomeProjectLimit,
) => projects.filter((p) => !p.deleted).slice(0, limit);
