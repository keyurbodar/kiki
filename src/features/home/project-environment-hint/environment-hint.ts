import type { Project } from "@/data/api/schemas/project";

type Json = Record<string, unknown>;

const record = (value: unknown): Json | undefined =>
  typeof value === "object" && value !== null ? (value as Json) : undefined;

const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "";

export const primaryRepos = (project: Project) =>
  project.repos
    .filter((repo) => repo.mode === "primary")
    .map((repo) => repo.repoFullName);

export const repoHasSetup = (setup: unknown, repo: string) => {
  const entry = list(record(setup)?.repositories)
    .map(record)
    .find((candidate) => candidate?.repository === repo);
  if (entry === undefined) return false;
  const scripts = record(entry.scripts);
  return (
    filled(scripts?.initialize) ||
    filled(scripts?.refresh) ||
    list(entry.startup).length > 0 ||
    list(entry.commands).length > 0
  );
};

export const reposNeedingSetup = (project: Project, setup: unknown) =>
  primaryRepos(project).filter((repo) => !repoHasSetup(setup, repo));

export const setupPrompt = (repos: ReadonlyArray<string>) =>
  `Set up ${repos.join(", ")} for this project: read the capy-setup skill, reconcile the payload against each repository, write the initialize, update-after-checkout, and startup scripts, and test-build the snapshot before activating.`;

export type EnvironmentHint =
  | { kind: "setup"; repos: ReadonlyArray<string> }
  | { kind: "snapshot" };

export const environmentHint = (
  project: Project,
  setup: unknown,
  snapshot: unknown,
): EnvironmentHint | null => {
  const setupRecord = record(setup);
  const snapshotRecord = record(snapshot);
  if (setupRecord === undefined || snapshotRecord === undefined) return null;
  if (
    snapshotRecord.building === true ||
    snapshotRecord.hasArtifact === true ||
    (snapshotRecord.configured === true && snapshotRecord.enabled !== true)
  )
    return null;
  if (setupRecord.activeVersionId !== null) return { kind: "snapshot" };
  const missing = reposNeedingSetup(project, setup);
  return {
    kind: "setup",
    repos: missing.length > 0 ? missing : primaryRepos(project),
  };
};
