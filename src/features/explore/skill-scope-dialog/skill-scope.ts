import type { SkillScope } from "@/data/api/schemas/explore";

export type ScopeChoice = "organization" | "project" | "personal";

export const scopePayload = (
  choice: ScopeChoice,
  userId: string | undefined,
  projectId: string | undefined,
): SkillScope | undefined =>
  choice === "organization"
    ? {}
    : choice === "personal"
      ? userId === undefined
        ? undefined
        : { userId }
      : projectId === undefined
        ? undefined
        : { projectId };

export const scopeDestination = (
  choice: ScopeChoice,
  orgName: string | undefined,
  projectName: string | undefined,
) =>
  choice === "organization"
    ? `the ${orgName ?? "organization"} drive`
    : choice === "personal"
      ? "your drive"
      : `${projectName ?? "the project"}'s shared files`;

export const addedToast = (
  result: { name: string; replaced: boolean },
  destination: string,
) => ({
  title: result.replaced ? `Updated ${result.name}` : `Added ${result.name}`,
  description: `skills/${result.name}/ in ${destination}`,
});
