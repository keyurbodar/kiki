/** `acme/web` → `web`, as Capy labels repositories. */
export const repoName = (repo: string) => repo.slice(repo.indexOf("/") + 1);

/** The local pull rows served by `pulls.localPullsForThread`. */
export interface LocalPull {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly repo: string;
  readonly branch: string;
  readonly author: string;
  readonly threadId: string | null;
  readonly updatedAt: number;
  readonly url: string;
}

type Fields = Readonly<Record<string, unknown>>;

const record = (value: unknown): Fields | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Fields)
    : undefined;

const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const time = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const decodeLocalPull = (value: unknown): LocalPull | undefined => {
  const fields = record(value);
  const id = str(fields?.id);
  const repo = str(fields?.repo);
  const number = num(fields?.number);
  if (
    fields === undefined ||
    id === undefined ||
    repo === undefined ||
    number === undefined
  ) {
    return undefined;
  }
  return {
    id,
    number,
    title: str(fields.title) ?? "",
    state: str(fields.state) ?? "draft",
    repo,
    branch:
      str(fields.branch) ??
      str(fields.headRef) ??
      str(fields.headRefName) ??
      "",
    author:
      str(fields.author) ??
      str(fields.authorLogin) ??
      str(fields.githubLogin) ??
      "",
    threadId: str(fields.threadId) ?? null,
    updatedAt: time(fields.updatedAt) ?? 0,
    url: str(fields.url) ?? `https://github.com/${repo}/pull/${number}`,
  };
};

export const decodeLocalPulls = (value: unknown): ReadonlyArray<LocalPull> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const pull = decodeLocalPull(item);
        return pull === undefined ? [] : [pull];
      })
    : [];

/** Groups local pulls by repository, newest repository first. */
export const groupLocalPulls = (
  pulls: ReadonlyArray<LocalPull>,
): ReadonlyArray<{ repo: string; pulls: ReadonlyArray<LocalPull> }> => {
  const groups = new Map<string, Array<LocalPull>>();
  for (const pull of pulls) {
    groups.set(pull.repo, [...(groups.get(pull.repo) ?? []), pull]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => repoName(a).localeCompare(repoName(b)))
    .map(([repo, rows]) => ({
      repo,
      pulls: [...rows].sort((a, b) => b.updatedAt - a.updatedAt),
    }));
};
