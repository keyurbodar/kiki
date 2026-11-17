export type PullState = "ready" | "draft" | "merged" | "closed";

export type DiffCategory = "database" | "tests" | "generated";

export type DiffCounts = {
  readonly files: number;
  readonly additions: number;
  readonly deletions: number;
};

export type DiffBreakdown = Readonly<Record<DiffCategory, DiffCounts>>;

export type PullLabel = { readonly name: string; readonly color: string };

export type PullReviewer = {
  readonly login: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly state: string | null;
};

export type Pull = {
  readonly id: string;
  readonly repo: string;
  readonly number: number;
  readonly title: string;
  readonly state: PullState;
  readonly author: string;
  readonly authorAvatarUrl: string | null;
  readonly createdAt: Date;
  readonly headRef: string;
  readonly headSha: string;
  readonly baseRef: string;
  readonly additions: number;
  readonly deletions: number;
  readonly diffBreakdown: DiffBreakdown | null;
  readonly url: string;
  readonly bodyMd: string | null;
  readonly threadId: string | null;
  readonly projectId: string | null;
  readonly mergedAt: Date | null;
  readonly closedAt: Date | null;
  readonly labels: ReadonlyArray<PullLabel>;
  readonly issues: ReadonlyArray<PullIssueRef>;
};

export type CheckRow = {
  readonly kind: "check" | "status";
  readonly name: string;
  readonly state: string | null;
  readonly conclusion: string | null;
  readonly detailsUrl: string | null;
};

export type CheckVerdict = "failure" | "pending" | "neutral" | "success";

export type PullThreadRef = {
  readonly id: string;
  readonly title: string | null;
};

export type PullIssueRef = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
};

type Json = Readonly<Record<string, unknown>>;

const record = (value: unknown): Json =>
  typeof value === "object" && value !== null ? (value as Json) : {};

const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pullState = (raw: Json): PullState => {
  const state = str(raw.state);
  if (state === "merged" || str(raw.mergedAt) !== null) return "merged";
  if (state === "closed") return "closed";
  if (state === "draft" || raw.draft === true) return "draft";
  return "ready";
};

const counts = (value: unknown): DiffCounts => {
  const raw = record(value);
  return {
    files: num(raw.files),
    additions: num(raw.additions),
    deletions: num(raw.deletions),
  };
};

const breakdown = (value: unknown): DiffBreakdown | null => {
  if (typeof value !== "object" || value === null) return null;
  const raw = record(value);
  return {
    database: counts(raw.database),
    tests: counts(raw.tests),
    generated: counts(raw.generated),
  };
};

export const toLabels = (value: unknown): ReadonlyArray<PullLabel> =>
  list(value).flatMap((item) => {
    const raw = record(item);
    const name = str(raw.name);
    return name === null ? [] : [{ name, color: str(raw.color) ?? "" }];
  });

export const toIssueRefs = (value: unknown): ReadonlyArray<PullIssueRef> =>
  list(value).flatMap((item) => {
    const raw = record(item);
    const id = str(raw.id);
    const code = str(raw.code);
    if (id === null || code === null) return [];
    return [{ id, code, title: str(raw.title) ?? "" }];
  });

export const toPull = (value: unknown): Pull | undefined => {
  const raw = record(value);
  const id = str(raw.id);
  const repo = str(raw.repo) ?? str(raw.repoFullName);
  if (id === null || repo === null) return undefined;
  const number = num(raw.number);
  return {
    id,
    repo,
    number,
    title: str(raw.title) ?? `${repo}#${number}`,
    state: pullState(raw),
    author: str(raw.author) ?? str(raw.authorLogin) ?? "",
    authorAvatarUrl: str(raw.authorAvatarUrl),
    createdAt: toDate(raw.createdAt) ?? toDate(raw.updatedAt) ?? new Date(0),
    headRef: str(raw.headRef) ?? "",
    headSha: str(raw.headSha) ?? "",
    baseRef: str(raw.baseRef) ?? "",
    additions: num(raw.additions),
    deletions: num(raw.deletions),
    diffBreakdown: breakdown(raw.diffBreakdown),
    url: str(raw.url) ?? `https://github.com/${repo}/pull/${number}`,
    bodyMd:
      typeof raw.bodyMd === "string"
        ? raw.bodyMd
        : typeof raw.body === "string"
          ? raw.body
          : null,
    threadId: str(raw.threadId),
    projectId: str(raw.projectId),
    mergedAt: toDate(raw.mergedAt),
    closedAt: toDate(raw.closedAt),
    labels: toLabels(raw.labels),
    issues: toIssueRefs(raw.issues),
  };
};

export const toCheckRows = (value: unknown): ReadonlyArray<CheckRow> =>
  list(value).flatMap((item) => {
    const raw = record(item);
    const name = str(raw.name);
    if (name === null) return [];
    return [
      {
        kind: raw.kind === "status" ? "status" : "check",
        name,
        state: str(raw.state),
        conclusion: str(raw.conclusion),
        detailsUrl: str(raw.detailsUrl),
      } as const,
    ];
  });

export const toReviewers = (value: unknown): ReadonlyArray<PullReviewer> =>
  list(value).flatMap((item) => {
    const raw = record(item);
    const login = str(raw.login);
    if (login === null) return [];
    return [
      {
        login,
        name: str(raw.name),
        avatarUrl: str(raw.avatarUrl),
        state:
          raw.approved === true
            ? "approved"
            : (str(raw.reviewState) ?? str(raw.submittedState)),
      },
    ];
  });

export const toThreadRefs = (value: unknown): ReadonlyArray<PullThreadRef> =>
  list(value).flatMap((item) => {
    const raw = record(item);
    const id = str(raw.id);
    return id === null ? [] : [{ id, title: str(raw.title) }];
  });

export const checkVerdict = (check: CheckRow): CheckVerdict => {
  if (check.kind === "status") {
    if (check.state === "failure" || check.state === "error") return "failure";
    return check.state === "success" ? "success" : "pending";
  }
  if (check.conclusion === null) return "pending";
  if (check.conclusion === "success") return "success";
  if (check.conclusion === "failure" || check.conclusion === "timed_out") {
    return "failure";
  }
  return "neutral";
};

const verdictOrder: Readonly<Record<CheckVerdict, number>> = {
  failure: 0,
  pending: 1,
  neutral: 2,
  success: 3,
};

export const sortChecks = (checks: ReadonlyArray<CheckRow>) =>
  [...checks].sort(
    (a, b) =>
      verdictOrder[checkVerdict(a)] - verdictOrder[checkVerdict(b)] ||
      a.name.localeCompare(b.name),
  );

export const checksSummary = (checks: ReadonlyArray<CheckRow>): string => {
  const tally = { failure: 0, pending: 0, neutral: 0, success: 0 };
  for (const check of checks) tally[checkVerdict(check)] += 1;
  const parts = [
    tally.failure > 0 ? `${tally.failure} failed` : null,
    tally.pending > 0 ? `${tally.pending} running` : null,
    tally.success > 0 ? `${tally.success} passed` : null,
    tally.neutral > 0 ? `${tally.neutral} skipped` : null,
  ].filter((part) => part !== null);
  return parts.length === 0 ? "No checks yet" : parts.join(", ");
};

export const rollupVerdict = (
  checks: ReadonlyArray<CheckRow>,
): CheckVerdict => {
  const verdicts = checks.map(checkVerdict);
  if (verdicts.includes("failure")) return "failure";
  if (verdicts.includes("pending")) return "pending";
  if (verdicts.includes("success")) return "success";
  return "neutral";
};

export const checkStatusWord = (check: CheckRow) => {
  const verdict = checkVerdict(check);
  if (verdict === "failure") return "Failed";
  if (verdict === "pending") return "Running";
  return verdict === "success" ? "Passed" : "Skipped";
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export const relativeTime = (
  at: Date | number,
  options?: { readonly now?: number; readonly minified?: boolean },
): string => {
  const delta =
    (options?.now ?? Date.now()) - (typeof at === "number" ? at : at.getTime());
  const minified = options?.minified === true;
  const size = Math.abs(delta);
  if (size < 5 * second) return minified ? "now" : "just now";
  const short =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  if (minified) return short;
  return delta < 0 ? `in ${short}` : `${short} ago`;
};

export const splitRepo = (repo: string) => {
  const [owner, name] = repo.split("/");
  return { owner: owner ?? "", name: name ?? repo };
};

export const repoName = (repo: string) => splitRepo(repo).name;

export const diffCategories: ReadonlyArray<DiffCategory> = [
  "database",
  "tests",
  "generated",
];

export const diffCategoryLabel: Readonly<Record<DiffCategory, string>> = {
  database: "Database",
  tests: "Tests",
  generated: "Generated",
};

export const visibleDiffCounts = (
  additions: number,
  deletions: number,
  diffBreakdown: DiffBreakdown | null,
) => {
  if (diffBreakdown === null) return { additions, deletions };
  return diffCategories.reduce(
    (total, category) => ({
      additions: total.additions - diffBreakdown[category].additions,
      deletions: total.deletions - diffBreakdown[category].deletions,
    }),
    { additions, deletions },
  );
};

export const hasDiffBreakdown = (
  diffBreakdown: DiffBreakdown | null,
): diffBreakdown is DiffBreakdown =>
  diffBreakdown !== null &&
  Object.values(diffBreakdown).some((entry) => entry.files > 0);
