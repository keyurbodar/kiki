import {
  type Pull,
  type PullState,
  toDate,
} from "@/components/pull-view/pull-model";

export type PullCommit = {
  readonly sha: string;
  readonly message: string;
  readonly authorLogin: string | null;
  readonly authorName: string;
  readonly committedAt: Date;
};

export type PullComment = {
  readonly id: string;
  readonly kind: "issue" | "review";
  readonly author: string;
  readonly authorAvatarUrl: string | null;
  readonly authorIsBot: boolean;
  readonly authoredAt: Date;
  readonly bodyMd: string;
  readonly edited: boolean;
  readonly resolved: boolean;
  readonly outdated: boolean;
  readonly file: string | null;
  readonly line: number | null;
  readonly githubReviewId: string | null;
};

export type PullReview = {
  readonly id: string;
  readonly githubReviewId: string | null;
  readonly reviewer: string;
  readonly authorAvatarUrl: string | null;
  readonly authorIsBot: boolean;
  readonly state: string;
  readonly bodyMd: string | null;
  readonly submittedAt: Date;
};

export type ReviewRound = {
  readonly requestId: string;
  readonly headSha: string | null;
  readonly status: "pending" | "running" | "completed" | "failed" | "stale";
  readonly title: string | null;
  readonly failureMessage: string | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
  readonly settledAt: Date | null;
};

export type ReviewSeverity = "low" | "medium" | "high";

export type ReviewFinding = {
  readonly id: string;
  readonly requestId: string;
  readonly kind: string;
  readonly status: string;
  readonly severity: ReviewSeverity | null;
  readonly title: string;
  readonly body: string;
  readonly path: string | null;
  readonly line: number | null;
};

export type PullActivityData = {
  readonly commits: ReadonlyArray<PullCommit>;
  readonly comments: ReadonlyArray<PullComment>;
  readonly reviews: ReadonlyArray<PullReview>;
};

export type CapyReviewData = {
  readonly threadId: string | null;
  readonly reviewedHeadSha: string | null;
  readonly rounds: ReadonlyArray<ReviewRound>;
  readonly findings: ReadonlyArray<ReviewFinding>;
};

export type ActivityItem =
  | { readonly kind: "opened"; readonly at: Date }
  | { readonly kind: "commit"; readonly at: Date; readonly commit: PullCommit }
  | {
      readonly kind: "comment";
      readonly at: Date;
      readonly comment: PullComment;
    }
  | {
      readonly kind: "gh-review";
      readonly at: Date;
      readonly review: PullReview;
      readonly threads: ReadonlyArray<CommentThread>;
    }
  | {
      readonly kind: "capy-round";
      readonly at: Date;
      readonly round: ReviewRound;
      readonly open: number;
      readonly resolved: number;
    }
  | {
      readonly kind: "terminal";
      readonly at: Date;
      readonly word: "Merged" | "Closed";
    };

export type CommentThread = {
  readonly root: PullComment;
  readonly replies: ReadonlyArray<PullComment>;
};

export type ActivityFilter = "all" | "comments" | "bots";

type Json = Readonly<Record<string, unknown>>;

const record = (value: unknown): Json =>
  typeof value === "object" && value !== null ? (value as Json) : {};

const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const bot = (login: string, raw: Json) =>
  raw.authorIsBot === true || login.endsWith("[bot]");

const toComment = (value: unknown): PullComment | undefined => {
  const raw = record(value);
  const id = str(raw.id);
  const authoredAt = toDate(raw.authoredAt) ?? toDate(raw.createdAt);
  if (id === null || authoredAt === null) return undefined;
  const author =
    str(raw.author) ?? str(raw.authorLogin) ?? str(raw.actorLogin) ?? "";
  return {
    id,
    kind: raw.kind === "review" || str(raw.path) !== null ? "review" : "issue",
    author,
    authorAvatarUrl: str(raw.authorAvatarUrl),
    authorIsBot: bot(author, raw),
    authoredAt,
    bodyMd: str(raw.bodyMd) ?? str(raw.body) ?? "",
    edited: raw.edited === true,
    resolved: raw.resolved === true,
    outdated: raw.outdated === true,
    file: str(raw.file) ?? str(raw.path),
    line: typeof raw.line === "number" ? raw.line : null,
    githubReviewId: str(raw.githubReviewId),
  };
};

const toReview = (value: unknown): PullReview | undefined => {
  const raw = record(value);
  const id = str(raw.id);
  const submittedAt = toDate(raw.submittedAt) ?? toDate(raw.createdAt);
  if (id === null || submittedAt === null) return undefined;
  const reviewer =
    str(raw.reviewer) ?? str(raw.authorLogin) ?? str(raw.author) ?? "";
  return {
    id,
    githubReviewId: str(raw.githubReviewId),
    reviewer,
    authorAvatarUrl: str(raw.authorAvatarUrl),
    authorIsBot: bot(reviewer, raw),
    state: (str(raw.state) ?? "commented").toLowerCase(),
    bodyMd: str(raw.bodyMd) ?? str(raw.body),
    submittedAt,
  };
};

const toCommit = (value: unknown): PullCommit | undefined => {
  const raw = record(value);
  const sha = str(raw.sha);
  const committedAt = toDate(raw.committedAt) ?? toDate(raw.createdAt);
  if (sha === null || committedAt === null) return undefined;
  return {
    sha,
    message: str(raw.message) ?? "",
    authorLogin: str(raw.authorLogin),
    authorName: str(raw.authorName) ?? str(raw.authorLogin) ?? "",
    committedAt,
  };
};

const defined = <A>(value: A | undefined): value is A => value !== undefined;

export const toActivityData = (value: unknown): PullActivityData => {
  const raw = record(value);
  return {
    commits: list(raw.commits).map(toCommit).filter(defined),
    comments: list(raw.comments).map(toComment).filter(defined),
    reviews: list(raw.reviews).map(toReview).filter(defined),
  };
};

const roundStatuses = new Set([
  "pending",
  "running",
  "completed",
  "failed",
  "stale",
]);

const severities: ReadonlyArray<ReviewSeverity> = ["low", "medium", "high"];

const severityOf = (value: unknown): ReviewSeverity | null => {
  const severity = str(value);
  return severities.find((candidate) => candidate === severity) ?? null;
};

export const toCapyReview = (value: unknown): CapyReviewData => {
  const raw = record(value);
  return {
    threadId: str(raw.threadId),
    reviewedHeadSha: str(raw.reviewedHeadSha),
    rounds: list(raw.rounds).flatMap((item) => {
      const round = record(item);
      const requestId = str(round.requestId);
      const status = str(round.status);
      const createdAt = toDate(round.createdAt);
      if (
        requestId === null ||
        status === null ||
        !roundStatuses.has(status) ||
        createdAt === null
      ) {
        return [];
      }
      return [
        {
          requestId,
          headSha: str(round.headSha) ?? str(round.observingHeadSha),
          status: status as ReviewRound["status"],
          title: str(round.title),
          failureMessage: str(round.failureMessage),
          failureReason: str(round.failureReason),
          createdAt,
          settledAt: toDate(round.settledAt),
        },
      ];
    }),
    findings: list(raw.findings).flatMap((item) => {
      const finding = record(item);
      const id = str(finding.id);
      const requestId = str(finding.requestId);
      if (id === null || requestId === null) return [];
      return [
        {
          id,
          requestId,
          kind: str(finding.kind) ?? "issue",
          status: str(finding.status) ?? "open",
          severity: severityOf(finding.severity),
          title: str(finding.summary) ?? str(finding.title) ?? "",
          body: str(finding.detail) ?? str(finding.body) ?? "",
          path: str(finding.file) ?? str(finding.path),
          line: num(finding.line) ?? num(finding.startLine),
        },
      ];
    }),
  };
};

const threadsOf = (comments: ReadonlyArray<PullComment>) => {
  const roots = comments.filter((comment) => comment.kind === "review");
  return roots.map((root) => ({ root, replies: [] }));
};

export const buildActivityItems = (
  pull: Pick<Pull, "createdAt" | "mergedAt" | "closedAt">,
  activity: PullActivityData | undefined,
  review: CapyReviewData | null,
): ReadonlyArray<ActivityItem> => {
  const items: Array<ActivityItem> = [{ kind: "opened", at: pull.createdAt }];
  if (activity !== undefined) {
    for (const commit of activity.commits) {
      items.push({ kind: "commit", at: commit.committedAt, commit });
    }
    for (const comment of activity.comments) {
      if (comment.kind === "issue") {
        items.push({ kind: "comment", at: comment.authoredAt, comment });
      }
    }
    const threads = threadsOf(activity.comments);
    for (const review of activity.reviews) {
      items.push({
        kind: "gh-review",
        at: review.submittedAt,
        review,
        threads: threads.filter(
          (thread) =>
            thread.root.githubReviewId !== null &&
            thread.root.githubReviewId === review.githubReviewId,
        ),
      });
    }
  }
  if (review !== null) {
    for (const round of review.rounds) {
      const findings = review.findings.filter(
        (finding) =>
          finding.requestId === round.requestId && finding.kind === "issue",
      );
      items.push({
        kind: "capy-round",
        at: round.settledAt ?? round.createdAt,
        round,
        resolved: findings.filter((finding) => finding.status === "resolved")
          .length,
        open: findings.filter((finding) => finding.status === "open").length,
      });
    }
  }
  if (pull.mergedAt !== null) {
    items.push({ kind: "terminal", at: pull.mergedAt, word: "Merged" });
  } else if (pull.closedAt !== null) {
    items.push({ kind: "terminal", at: pull.closedAt, word: "Closed" });
  }
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
};

export const matchesActivityFilter = (
  item: ActivityItem,
  filter: ActivityFilter,
): boolean => {
  switch (item.kind) {
    case "comment":
      return (
        filter === "all" || (filter === "bots") === item.comment.authorIsBot
      );
    case "gh-review":
      return (
        filter === "all" || (filter === "bots") === item.review.authorIsBot
      );
    case "capy-round":
      return filter !== "comments";
    default:
      return filter === "all";
  }
};

export const activityItemKey = (item: ActivityItem): string => {
  switch (item.kind) {
    case "opened":
      return "opened";
    case "commit":
      return `commit:${item.commit.sha}`;
    case "comment":
      return `comment:${item.comment.id}`;
    case "gh-review":
      return `gh-review:${item.review.id}`;
    case "capy-round":
      return `capy-round:${item.round.requestId}`;
    case "terminal":
      return `terminal:${item.word}`;
  }
};

export const commitLine = (commit: PullCommit) =>
  `${commit.authorLogin ?? commit.authorName} committed ${commit.sha.slice(0, 7)} ${commit.message.split("\n")[0] ?? ""}`;

export const reviewStateWord = (state: string): string | undefined => {
  switch (state) {
    case "approved":
    case "changes_requested":
      return undefined;
    case "commented":
      return "reviewed";
    case "dismissed":
      return "review dismissed";
    default:
      return state.replaceAll("_", " ");
  }
};

export const capyRoundTitle = (
  round: ReviewRound,
  open: number,
  resolved: number,
) => {
  if (round.status !== "completed") return "Capy Review";
  const total = open + resolved;
  if (total === 0) return "Capy Review approved";
  return `Capy Review found ${total} ${total === 1 ? "issue" : "issues"}`;
};

export const roundFailureText = (round: ReviewRound) =>
  `Review failed${
    round.failureMessage === null
      ? round.failureReason === null
        ? ""
        : `: ${round.failureReason}`
      : `: ${round.failureMessage}`
  }`;

export const terminalStates: ReadonlyArray<PullState> = ["merged", "closed"];
