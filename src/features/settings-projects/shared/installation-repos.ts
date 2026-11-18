export type InstallationRepo = {
  readonly githubRepoId: number;
  readonly repoFullName: string;
  readonly defaultBranch: string | null;
  readonly pushedAt: Date | null;
  readonly archived: boolean;
};

const fields = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const installationRepoRow = (value: unknown): InstallationRepo | undefined => {
  const row = fields(value);
  const fullName =
    typeof row?.repoFullName === "string"
      ? row.repoFullName
      : typeof row?.fullName === "string"
        ? row.fullName
        : undefined;
  const id =
    typeof row?.githubRepoId === "number" ? row.githubRepoId : undefined;
  if (row === undefined || fullName === undefined || id === undefined) {
    return undefined;
  }
  const pushedAt =
    typeof row.pushedAt === "string" ? new Date(row.pushedAt) : undefined;
  return {
    githubRepoId: id,
    repoFullName: fullName,
    defaultBranch:
      typeof row.defaultBranch === "string" ? row.defaultBranch : null,
    pushedAt:
      pushedAt === undefined || Number.isNaN(pushedAt.getTime())
        ? null
        : pushedAt,
    archived: row.archived === true,
  };
};

/**
 * `listGitHubInstallationRepos` is undecoded, so accept either a bare list of
 * repositories or a `{ state, repos }` envelope. A list means an installation
 * exists; a `connect_required` envelope means it does not.
 */
export const readInstallation = (
  value: unknown,
): {
  readonly installed: boolean;
  readonly repos: ReadonlyArray<InstallationRepo>;
} => {
  const envelope = fields(value);
  const unpacked = Array.isArray(value)
    ? { installed: true, rows: value }
    : {
        installed: envelope?.state !== "connect_required",
        rows: Array.isArray(envelope?.repos) ? envelope.repos : [],
      };
  return {
    installed: unpacked.installed,
    repos: unpacked.rows.flatMap((row) => {
      const decoded = installationRepoRow(row);
      return decoded === undefined ? [] : [decoded];
    }),
  };
};

/** `acme/web` → `web`, the name Capy derives a project from. */
export const repoName = (repoFullName: string) =>
  repoFullName.slice(repoFullName.indexOf("/") + 1);
