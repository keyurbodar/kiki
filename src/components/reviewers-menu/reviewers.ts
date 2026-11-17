export type Reviewer = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
};

export type RequestedReviewer = {
  kind: "user" | "team";
  login: string;
  avatarUrl: string | null;
};

export type PullReview = {
  reviewer: string;
  state: string;
  submittedAt: Date;
  authorAvatarUrl: string | null;
};

export type ReviewerOptions = {
  requested: ReadonlyArray<Reviewer>;
  suggested: ReadonlyArray<Reviewer>;
  collaborators: ReadonlyArray<Reviewer>;
};

export type ReviewerRow = {
  reviewer: Reviewer;
  /** The reviewer's latest verdict, shown at the row's end. */
  word: string | null;
  /** Reviewed but no longer requested: checking re-requests a review. */
  rerequest: boolean;
};

export type ReviewerGroupId = "current" | "suggested" | "other";

export type ReviewerGroup = {
  value: ReviewerGroupId;
  items: ReadonlyArray<ReviewerRow>;
};

export const reviewerGroupLabels: Record<ReviewerGroupId, string> = {
  current: "Reviewers",
  suggested: "Suggested",
  other: "Everyone",
};

export const reviewWords: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Requested changes",
  commented: "Commented",
  dismissed: "Dismissed",
};

/** Each reviewer's most recent review, by login. */
export const latestReviews = (reviews: ReadonlyArray<PullReview>) => {
  const latest = new Map<string, PullReview>();
  for (const review of reviews) {
    const seen = latest.get(review.reviewer);
    if (
      seen === undefined ||
      seen.submittedAt.getTime() < review.submittedAt.getTime()
    ) {
      latest.set(review.reviewer, review);
    }
  }
  return latest;
};

const plainRow = (reviewer: Reviewer): ReviewerRow => ({
  reviewer,
  word: null,
  rerequest: false,
});

/**
 * The menu's groups: requested reviewers and past reviewers first, then
 * GitHub's suggestions, then every other collaborator except the author.
 * While options load, only the current group is known.
 */
export const reviewerGroups = (
  requested: ReadonlyArray<Reviewer>,
  options: ReviewerOptions | null,
  latest: ReadonlyMap<string, PullReview>,
  author: string,
): ReadonlyArray<ReviewerGroup> => {
  const requestedLogins = new Set(requested.map((reviewer) => reviewer.login));
  const current: ReadonlyArray<ReviewerRow> = [
    ...requested.map((reviewer) => ({
      reviewer,
      word: latest.has(reviewer.login)
        ? (reviewWords[latest.get(reviewer.login)?.state ?? ""] ?? null)
        : null,
      rerequest: false,
    })),
    ...[...latest.values()]
      .filter((review) => !requestedLogins.has(review.reviewer))
      .map((review) => ({
        reviewer: {
          login: review.reviewer,
          avatarUrl: review.authorAvatarUrl,
          name: null,
        },
        word: reviewWords[review.state] ?? null,
        rerequest: true,
      })),
  ];
  if (options === null) return [{ value: "current", items: current }];
  const listed = new Set(current.map((row) => row.reviewer.login));
  const available = (reviewer: Reviewer) =>
    !listed.has(reviewer.login) && reviewer.login !== author;
  const suggested = options.suggested.filter(available);
  const other = options.collaborators.filter(
    (reviewer) =>
      available(reviewer) &&
      !suggested.some((candidate) => candidate.login === reviewer.login),
  );
  const groups: ReadonlyArray<ReviewerGroup> = [
    { value: "current", items: current },
    { value: "suggested", items: suggested.map(plainRow) },
    { value: "other", items: other.map(plainRow) },
  ];
  return groups.filter((group) => group.items.length > 0);
};

export const reviewerMatches = (row: ReviewerRow, query: string) => {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return [row.reviewer.login, row.reviewer.name ?? ""].some((text) =>
    text.toLowerCase().includes(needle),
  );
};

export const sameReviewer = (a: ReviewerRow, b: ReviewerRow) =>
  a.reviewer.login === b.reviewer.login;

/** The reviewers the field shows: requested users, teams, then past reviewers; six at most. */
export const reviewerSummary = (
  requested: ReadonlyArray<RequestedReviewer>,
  storedUsers: ReadonlyArray<{
    login: string;
    avatarUrl: string | null;
  }> | null,
  latest: ReadonlyMap<string, PullReview>,
) => {
  const shown = [
    ...(storedUsers ??
      requested.filter((reviewer) => reviewer.kind === "user")),
    ...requested.filter((reviewer) => reviewer.kind === "team"),
  ].map((reviewer) => ({
    login: reviewer.login,
    avatarUrl: reviewer.avatarUrl,
  }));
  const shownLogins = new Set(
    shown.map((reviewer) => reviewer.login.toLowerCase()),
  );
  const reviewedOnly = [...latest.values()]
    .filter((review) => !shownLogins.has(review.reviewer.toLowerCase()))
    .map((review) => ({
      login: review.reviewer,
      avatarUrl: review.authorAvatarUrl,
    }));
  return [...shown, ...reviewedOnly].slice(0, 6);
};

/** The one reviewer a multi-select change requests or un-requests, or null. */
export const reviewerToggle = (
  next: ReadonlyArray<ReviewerRow>,
  selected: ReadonlyArray<ReviewerRow>,
): { login: string; requested: boolean } | null => {
  const added = next.find((row) => !selected.some((s) => sameReviewer(s, row)));
  if (added !== undefined)
    return { login: added.reviewer.login, requested: true };
  const removed = selected.find(
    (row) => !next.some((n) => sameReviewer(n, row)),
  );
  return removed === undefined
    ? null
    : { login: removed.reviewer.login, requested: false };
};

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const toReviewer = (value: unknown): Reviewer | null => {
  const raw = record(value);
  if (typeof raw.login !== "string") return null;
  return {
    login: raw.login,
    name: typeof raw.name === "string" ? raw.name : null,
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : null,
  };
};

const reviewersIn = (value: unknown): ReadonlyArray<Reviewer> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const reviewer = toReviewer(item);
        return reviewer === null ? [] : [reviewer];
      })
    : [];

/**
 * Reads the reviewers endpoint. Capy answers `{ requested, suggested,
 * collaborators }`; a bare list is read as the requested reviewers.
 */
export const readReviewerOptions = (value: unknown): ReviewerOptions => {
  if (Array.isArray(value)) {
    return { requested: reviewersIn(value), suggested: [], collaborators: [] };
  }
  const raw = record(value);
  return {
    requested: reviewersIn(raw.requested),
    suggested: reviewersIn(raw.suggested),
    collaborators: reviewersIn(raw.collaborators),
  };
};
