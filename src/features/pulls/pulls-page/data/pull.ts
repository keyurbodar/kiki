/**
 * The pull request shapes the /pulls screens read. The pulls, branches and
 * installation-repo endpoints are still `Undecoded` in the API contract, so
 * these decoders read Capy's `PullRequestPage` / `PullRequestCard` fields and
 * fall back to the mock's detail fields where they differ.
 */

export const pullStates = [
  "ready",
  "pending",
  "failed",
  "draft",
  "merged",
  "closed",
] as const;

export type PullState = (typeof pullStates)[number];

export type ChecksState = "none" | "pending" | "passed" | "failed";

export interface PullThreadChip {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly projectCode: string | null;
}

export interface PullCard {
  readonly id: string;
  readonly projectId: string | null;
  readonly repo: string;
  readonly number: number;
  readonly title: string;
  readonly state: PullState;
  readonly checksState: ChecksState;
  readonly additions: number;
  readonly deletions: number;
  readonly author: string;
  readonly authorAvatarUrl: string;
  readonly repoAvatarUrl: string;
  readonly url: string;
  readonly headRef: string;
  readonly baseRef: string;
  readonly threadId: string | null;
  readonly thread: PullThreadChip | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PullPage {
  readonly items: ReadonlyArray<PullCard>;
  readonly cursor: string | null;
}

export interface InstallationRepo {
  readonly fullName: string;
  readonly defaultBranch: string | null;
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

const isState = (value: unknown): value is PullState =>
  pullStates.includes(value as PullState);

const checksStates: ReadonlyArray<ChecksState> = [
  "none",
  "pending",
  "passed",
  "failed",
];

const decodeThread = (value: unknown): PullThreadChip | null => {
  const fields = record(value);
  const id = str(fields?.id);
  if (fields === undefined || id === undefined) return null;
  return {
    id,
    number: num(fields.number) ?? 0,
    title: str(fields.title) ?? "",
    projectCode: str(fields.projectCode) ?? null,
  };
};

export const decodePull = (value: unknown): PullCard | undefined => {
  const fields = record(value);
  const id = str(fields?.id);
  const repo = str(fields?.repo) ?? str(fields?.repoFullName);
  const number = num(fields?.number);
  if (fields === undefined || id === undefined || repo === undefined) {
    return undefined;
  }
  if (number === undefined) return undefined;
  const updatedAt = time(fields.updatedAt) ?? 0;
  const checks = str(fields.checksState) as ChecksState | undefined;
  const thread = decodeThread(fields.thread);
  return {
    id,
    projectId: str(fields.projectId) ?? null,
    repo,
    number,
    title: str(fields.title) ?? "",
    state: isState(fields.state) ? fields.state : "pending",
    checksState:
      checks !== undefined && checksStates.includes(checks) ? checks : "none",
    additions: num(fields.additions) ?? 0,
    deletions: num(fields.deletions) ?? 0,
    author: str(fields.author) ?? str(fields.authorLogin) ?? "",
    authorAvatarUrl: str(fields.authorAvatarUrl) ?? "",
    repoAvatarUrl:
      str(fields.repoAvatarUrl) ?? str(fields.ownerAvatarUrl) ?? "",
    url: str(fields.url) ?? `https://github.com/${repo}/pull/${number}`,
    headRef: str(fields.headRef) ?? "",
    baseRef: str(fields.baseRef) ?? "",
    threadId: thread?.id ?? str(fields.threadId) ?? null,
    thread,
    createdAt: time(fields.createdAt) ?? updatedAt,
    updatedAt,
  };
};

const decodeList = <A>(
  value: unknown,
  decode: (item: unknown) => A | undefined,
): ReadonlyArray<A> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const decoded = decode(item);
        return decoded === undefined ? [] : [decoded];
      })
    : [];

/** Reads a `PullRequestPage`, or a bare array of pulls. */
export const decodePullPage = (value: unknown): PullPage => {
  const fields = record(value);
  return fields === undefined
    ? { items: decodeList(value, decodePull), cursor: null }
    : {
        items: decodeList(fields.items, decodePull),
        cursor: str(fields.cursor) ?? null,
      };
};

/** Reads `GitHubInstallationRepoList`, or a bare array of repos. */
export const decodeInstallationRepos = (
  value: unknown,
): ReadonlyArray<InstallationRepo> =>
  decodeList(record(value)?.repos ?? value, (item) => {
    const fields = record(item);
    const fullName = str(fields?.repoFullName) ?? str(fields?.fullName);
    if (fullName === undefined || fields?.archived === true) return undefined;
    return { fullName, defaultBranch: str(fields?.defaultBranch) ?? null };
  });

/** Reads branch names, as strings or `{ name, repo }` rows. */
export const decodeBranches = (
  value: unknown,
  repo: string,
): ReadonlyArray<string> =>
  decodeList(value, (item) => {
    if (typeof item === "string") return item;
    const fields = record(item);
    const rowRepo = str(fields?.repo);
    return rowRepo === undefined || rowRepo === repo
      ? str(fields?.name)
      : undefined;
  });

/** `acme/web` → `web`, as Capy labels repositories. */
export const repoName = (repo: string) => repo.slice(repo.indexOf("/") + 1);
