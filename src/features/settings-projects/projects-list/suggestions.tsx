const suggestionWindowMs = 2_592_000_000;
const maxSuggestions = 10;

export type InstallationRepo = {
  readonly githubRepoId: number;
  readonly repoFullName: string;
  readonly defaultBranch: string | null;
  readonly pushedAt: Date | null;
  readonly archived: boolean;
};

/**
 * Repositories offered as new projects: pushed in the last 30 days, not
 * archived, not already in a project, matching the search, newest first.
 */
export function suggestedRepos({
  repos,
  taken,
  search,
  now,
}: {
  readonly repos: ReadonlyArray<InstallationRepo>;
  readonly taken: ReadonlyArray<string>;
  readonly search: string;
  readonly now: number;
}): ReadonlyArray<InstallationRepo & { readonly pushedAt: Date }> {
  const takenNames = new Set(taken.map((name) => name.toLowerCase()));
  const query = search.toLowerCase();
  return repos
    .filter(
      (repo): repo is InstallationRepo & { readonly pushedAt: Date } =>
        !repo.archived &&
        !takenNames.has(repo.repoFullName.toLowerCase()) &&
        repo.pushedAt !== null &&
        now - repo.pushedAt.getTime() < suggestionWindowMs &&
        repo.repoFullName.toLowerCase().includes(query),
    )
    .toSorted(
      (a, b) =>
        b.pushedAt.getTime() - a.pushedAt.getTime() ||
        a.repoFullName.localeCompare(b.repoFullName),
    )
    .slice(0, maxSuggestions);
}

/** "No repositories", "acme/web", or the first two and "+N". */
export function repositoriesLabel(repos: ReadonlyArray<string>) {
  if (repos.length === 0) return <span>No repositories</span>;
  const shown = repos.slice(0, 2);
  return (
    <span className="truncate">
      {shown.join(", ")}
      {repos.length > shown.length && (
        <span className="text-muted-foreground-2">
          , +{repos.length - shown.length}
        </span>
      )}
    </span>
  );
}
