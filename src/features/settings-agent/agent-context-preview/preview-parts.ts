import type { DriveScopeFiles } from "@/data/atoms/agent-context";
import { type AgentScope, skillNameOf } from "../agent-scopes";

/** One line of Capy's "Loaded before the first message" breakdown. */
export type PreviewPart = {
  kind: AgentScope["part"] | "skills";
  label: string;
  file: string;
  chars: number;
  loaded: number;
  skillCount?: number;
  deferred?: boolean;
};

/** The size of every skill a set of scopes loads, deduplicated by name with the later scope winning. */
export const loadedSkills = (
  scopes: ReadonlyArray<AgentScope>,
  files: ReadonlyArray<DriveScopeFiles | undefined>,
) => {
  const byName = new Map<string, number>();
  scopes.forEach((_, index) => {
    for (const entry of files[index]?.entries ?? []) {
      const name = skillNameOf(entry.path);
      if (name !== undefined) byName.set(name, entry.sizeBytes);
    }
  });
  return [...byName.values()];
};

/**
 * Capy's breakdown, built from the scopes the page already reads. Capy's server
 * sends the same list; this is the fallback while `agentContextPreview` answers
 * its provisional shape.
 */
export const localPreviewParts = (
  scopes: ReadonlyArray<AgentScope>,
  files: ReadonlyArray<DriveScopeFiles | undefined>,
): PreviewPart[] => [
  ...scopes.map((scope, index) => {
    const chars =
      files[index]?.entries.find((entry) => entry.path === "AGENTS.md")
        ?.sizeBytes ?? 0;
    return {
      kind: scope.part,
      label: scope.name,
      file: "AGENTS.md",
      chars,
      loaded: chars,
    };
  }),
  (() => {
    const skills = loadedSkills(scopes, files);
    const chars = skills.reduce((sum, size) => sum + size, 0);
    return {
      kind: "skills" as const,
      label: skills.length === 1 ? "1 skill" : `${skills.length} skills`,
      file: "skills",
      chars,
      loaded: chars,
      skillCount: skills.length,
    };
  })(),
];

export const localUsed = (parts: ReadonlyArray<PreviewPart>) =>
  parts.reduce((sum, part) => sum + part.loaded, 0);
