export type LocalDiffEntry = {
  repo: string;
  path: string;
  patch: string | null;
};

export type LocalDiffRepo = {
  repo: string;
  branch: string | null;
  entries: ReadonlyArray<LocalDiffEntry>;
};

export const localDiffFileCount = (repos: ReadonlyArray<LocalDiffRepo>) =>
  repos.reduce((total, repo) => total + repo.entries.length, 0);

export const changedPathsCount = (
  repos: ReadonlyArray<{ dirtyPaths: ReadonlyArray<string> }>,
) => repos.reduce((total, repo) => total + repo.dirtyPaths.length, 0);

export const newHunkLine = (patch: string | null) => {
  if (patch === null) return undefined;
  const match = patch.match(/^@@ -\d+(?:,\d+)? \+(\d+)/m);
  return match === null || match[1] === "0" ? undefined : Number(match[1]);
};
