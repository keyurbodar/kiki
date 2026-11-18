import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  projectMutations,
  projectWriteKeys,
} from "@/data/atoms/project-settings";
import { deriveProjectCode } from "./project-code";

export type CreatableRepo = {
  readonly repoFullName: string;
  readonly defaultBranch: string | null;
};

/**
 * Capy's one-repository create: derive the thread code from the repository
 * name, create it, and refresh every key a project write touches. `creating`
 * names the repository in flight so its own row can show "Creating" while the
 * others stay disabled.
 */
export function useCreateProject(orgId: OrgId | undefined) {
  const create = useAtomSet(projectMutations.create, { mode: "promise" });
  const [creating, setCreating] = useState<string | null>(null);

  const createProject = (repo: CreatableRepo) => {
    if (orgId === undefined) return;
    setCreating(repo.repoFullName);
    create({
      params: { orgId },
      payload: {
        code: deriveProjectCode(
          repo.repoFullName.slice(repo.repoFullName.indexOf("/") + 1),
        ),
        repos: [
          {
            repoFullName: repo.repoFullName,
            baseBranch: repo.defaultBranch ?? "main",
          },
        ],
      },
      reactivityKeys: projectWriteKeys(orgId, ""),
    })
      .then(() => toast.success("Project created"))
      .catch(() => toast.error("Could not create the project"))
      .finally(() => setCreating(null));
  };

  return { creating, createProject };
}
