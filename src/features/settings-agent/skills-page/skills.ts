import type { DriveEntry, DriveScopeFiles } from "@/data/atoms/agent-context";
import { type AgentScope, skillNameOf } from "../agent-scopes";

export type ListedSkill = {
  scope: AgentScope;
  name: string;
  entry: DriveEntry;
  hiddenBy?: AgentScope | undefined;
};

/**
 * Capy's skill list: every skills/<name>/SKILL.md per scope, sorted by name
 * within a scope. A skill is replaced by the same name in a later,
 * more specific non-captain scope.
 */
export const listSkills = (
  scopes: ReadonlyArray<AgentScope>,
  files: ReadonlyArray<DriveScopeFiles | undefined>,
): ListedSkill[] => {
  const found = scopes.flatMap((scope, index) =>
    (files[index]?.entries ?? [])
      .flatMap((entry) => {
        const name = skillNameOf(entry.path);
        return name === undefined ? [] : [{ scope, name, entry }];
      })
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  );
  return found.map((skill) => ({
    ...skill,
    hiddenBy:
      skill.scope.captain === undefined
        ? found
            .filter(
              (other) =>
                other.name === skill.name &&
                other.scope.captain === undefined &&
                scopes.indexOf(other.scope) > scopes.indexOf(skill.scope),
            )
            .at(-1)?.scope
        : undefined,
  }));
};

export const skillsCountLabel = (count: number) =>
  count === 0 ? "No skills" : count === 1 ? "1 skill" : `${count} skills`;

export const filterSkills = (
  skills: ReadonlyArray<ListedSkill>,
  query: string,
) => {
  const needle = query.trim().toLowerCase();
  return skills.filter((skill) => needle === "" || skill.name.includes(needle));
};
