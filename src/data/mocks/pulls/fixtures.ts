import {
  isoMinutesAgo,
  issueLabels,
  issues,
  people,
  pulls,
  repos,
  threads,
} from "../fixtures/world.ts";

export const defaultLocalPull = {
  id: "localpull_mock_1",
  number: 213,
  title: "Retry checkout on gateway timeouts",
  state: "open",
  repo: pulls[1]!.repo,
  headRef: pulls[1]!.headRef,
  baseRef: pulls[1]!.baseRef,
  authorLogin: people.alex.githubLogin,
  additions: pulls[1]!.additions,
  deletions: pulls[1]!.deletions,
  filesChanged: 3,
  headSha: "c2f8a10d9b47",
  createdAt: isoMinutesAgo(45),
  updatedAt: isoMinutesAgo(4),
};

export const pullFiles = [
  {
    path: "src/checkout/retry.ts",
    status: "modified",
    additions: 14,
    deletions: 3,
    diff: "@@ -18,6 +18,17 @@ export async function placeOrder(input) {\n+  const retry = async (attempt: number) => {\n+    try {\n+      return await gateway.submit(input);\n+    } catch (error) {\n+      if (attempt < 2 && isGatewayTimeout(error)) {\n+        return retry(attempt + 1);\n+      }\n+      throw error;\n+    }\n+  };",
  },
  {
    path: "test/checkout/retry.test.ts",
    status: "added",
    additions: 12,
    deletions: 0,
    diff: '@@ -0,0 +1,12 @@\n+describe("checkout retry", () => {\n+  it("retries gateway timeouts", async () => {\n+    expect(await placeOrder(sampleOrder)).toMatchObject({ status: "ok" });\n+  });\n+});',
  },
  {
    path: "src/checkout/gateway.ts",
    status: "modified",
    additions: 3,
    deletions: 1,
    diff: '@@ -4,7 +4,9 @@ export const isGatewayTimeout = (error: unknown) =>\n-  error instanceof Error && error.name === "Timeout";\n+  error instanceof Error &&\n+  (error.name === "Timeout" || error.name === "GatewayTimeout");',
  },
];

export const pullChecks = [
  {
    id: "check_sample_ci",
    name: "CI / unit tests",
    status: "completed",
    conclusion: "success",
    detailsUrl: "https://github.com/acme/web/actions/runs/128",
    startedAt: isoMinutesAgo(32),
    completedAt: isoMinutesAgo(28),
  },
  {
    id: "check_sample_types",
    name: "CI / typecheck",
    status: "completed",
    conclusion: "success",
    detailsUrl: "https://github.com/acme/web/actions/runs/128",
    startedAt: isoMinutesAgo(32),
    completedAt: isoMinutesAgo(29),
  },
  {
    id: "check_sample_review",
    name: "Review / findings",
    status: "in_progress",
    conclusion: null,
    detailsUrl: null,
    startedAt: isoMinutesAgo(6),
    completedAt: null,
  },
];

export const pullChecksNames = pullChecks.map((check) => check.name);

const authorOf = (authorId: string) =>
  Object.values(people).find((person) => person.id === authorId);

const authorLogin = (authorId: string) =>
  authorOf(authorId)?.githubLogin ?? "alex-sample";

export const pullDetails = pulls.map((pull) => ({
  ...pull,
  issueIds: issues
    .filter((issue) => issue.pullIds.includes(pull.id))
    .map((issue) => issue.id),
  authorLogin: authorLogin(pull.authorId),
  repoFullName: pull.repo,
  url: `https://github.com/${pull.repo}/pull/${pull.number}`,
  body:
    pull.state === "draft"
      ? "Working through the retry limit and the test for gateway timeouts."
      : `Updates ${pull.headRef} for the ${pull.baseRef} branch. Closes the linked issue.`,
  filesChanged: pullFiles.length,
  commentsCount: pull.number === 128 ? 2 : pull.number === 131 ? 1 : 0,
  commitsCount: 2,
  mergedAt: pull.state === "merged" ? isoMinutesAgo(9 * 24 * 60) : null,
  closedAt:
    pull.state === "closed" || pull.state === "merged"
      ? isoMinutesAgo(pull.number === 119 ? 9 * 24 * 60 : 12 * 24 * 60)
      : null,
  draft: pull.state === "draft",
  autoMerge: false,
  reviewDecision: pull.state === "ready" ? "review_required" : null,
  additions: pull.additions,
  deletions: pull.deletions,
}));

export const pullIssues = pulls.flatMap((pull) => {
  const issue = issues.find((candidate) => candidate.pullIds.includes(pull.id));
  if (!issue) return [];
  return [
    {
      id: issue.id,
      code: issue.code,
      number: issue.number,
      title: issue.title,
      stateId: issue.stateId,
      state: issue.stateId,
      url: `https://github.com/acme/issues/${issue.number}`,
    },
  ];
});

const assignedLabels = issueLabels.filter((label) =>
  issues.some(
    (issue) =>
      issue.pullIds.includes(pulls[0]!.id) && issue.labelIds.includes(label.id),
  ),
);

export const pullLabels = assignedLabels.map((label) => ({
  id: label.id,
  name: label.name,
  color: label.color,
}));

export const pullThreads = pulls.flatMap((pull) => {
  if (!pull.threadId) return [];
  const thread = Object.values(threads).find(
    (item) => item.id === pull.threadId,
  );
  if (!thread) return [];
  return [
    {
      id: thread.id,
      number: thread.number,
      title: thread.title,
      projectId: thread.projectId,
    },
  ];
});

interface PullCommentRow {
  readonly id: string;
  readonly pullId: string;
  readonly authorId: string;
  readonly authorLogin: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolved: boolean;
  readonly path: string | null;
  readonly line: number | null;
}

export const pullComments: ReadonlyArray<PullCommentRow> = [
  {
    id: "cmt_sample_1",
    pullId: pulls[0]!.id,
    authorId: people.priya.id,
    authorLogin: people.priya.githubLogin,
    body: "The retry cap looks right. Can we log the attempt count for support?",
    createdAt: isoMinutesAgo(28),
    updatedAt: isoMinutesAgo(26),
    resolved: false,
    path: pullFiles[0]!.path,
    line: 24,
  },
  {
    id: "cmt_sample_2",
    pullId: pulls[0]!.id,
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    body: "Added the log line and pushed the branch.",
    createdAt: isoMinutesAgo(12),
    updatedAt: isoMinutesAgo(12),
    resolved: false,
    path: null,
    line: null,
  },
  {
    id: "cmt_sample_3",
    pullId: pulls[1]!.id,
    authorId: people.alex.id,
    authorLogin: people.alex.githubLogin,
    body: "Waiting on the CI rerun before marking this ready.",
    createdAt: isoMinutesAgo(7),
    updatedAt: isoMinutesAgo(7),
    resolved: false,
    path: null,
    line: null,
  },
];

export const pullReviewers = [
  {
    id: people.priya.id,
    login: people.priya.githubLogin,
    name: `${people.priya.firstName} ${people.priya.lastName}`,
    role: "reviewer",
    state: "pending",
    approved: false,
  },
  {
    id: people.jordan.id,
    login: people.jordan.githubLogin,
    name: `${people.jordan.firstName} ${people.jordan.lastName}`,
    role: "reviewer",
    state: "reviewed",
    approved: true,
  },
];

interface PullReviewRow {
  readonly id: string;
  readonly githubReviewId: string;
  readonly pullId: string;
  readonly authorId: string;
  readonly authorLogin: string;
  readonly state: string;
  readonly body: string;
  readonly submittedAt: string;
}

export const pullReviews: ReadonlyArray<PullReviewRow> = [
  {
    id: "ghr_sample_1",
    githubReviewId: "ghr_sample_1",
    pullId: pulls[0]!.id,
    authorId: people.jordan.id,
    authorLogin: people.jordan.githubLogin,
    state: "approved",
    body: "Looks good to me.",
    submittedAt: isoMinutesAgo(18),
  },
  {
    id: "ghr_sample_2",
    githubReviewId: "ghr_sample_2",
    pullId: pulls[0]!.id,
    authorId: people.priya.id,
    authorLogin: people.priya.githubLogin,
    state: "changes_requested",
    body: "Please log the retry attempt count.",
    submittedAt: isoMinutesAgo(24),
  },
];

interface PullFindingRow {
  readonly id: string;
  readonly pullId: string;
  readonly title: string;
  readonly body: string;
  readonly severity: string;
  readonly status: string;
  readonly path: string;
  readonly line: number;
  readonly createdAt: string;
  readonly kind?: "issue" | "note";
  readonly confidence?: "confident" | "investigate" | null;
  readonly summary?: string;
  readonly detail?: string | null;
  readonly suggestion?: string | null;
  readonly file?: string;
  readonly startLine?: number | null;
  readonly observingHeadSha?: string;
}

export const pullFindings: ReadonlyArray<PullFindingRow> = [
  {
    id: "find_sample_1",
    pullId: pulls[0]!.id,
    title: "Log the retry attempt count",
    body: "Support needs the attempt number when a checkout eventually fails.",
    severity: "medium",
    status: "open",
    path: pullFiles[0]!.path,
    line: 24,
    createdAt: isoMinutesAgo(26),
    kind: "issue",
    confidence: "confident",
    summary: "Log the retry attempt count",
    detail:
      "Support needs the attempt number when a checkout eventually fails.",
    suggestion:
      '      if (attempt < 2 && isGatewayTimeout(error)) {\n        logger.warn("checkout retry", { attempt });',
    file: pullFiles[0]!.path,
    startLine: 23,
    observingHeadSha: "c2f8a10d9b47",
  },
  {
    id: "find_sample_2",
    pullId: pulls[0]!.id,
    title: "Cover repeated gateway timeouts",
    body: "The current test only retries once.",
    severity: "low",
    status: "open",
    path: pullFiles[1]!.path,
    line: 4,
    createdAt: isoMinutesAgo(22),
    kind: "issue",
    confidence: "confident",
    summary: "Cover repeated gateway timeouts",
    detail: "The current test only retries once.",
    suggestion: null,
    file: pullFiles[1]!.path,
    startLine: null,
    observingHeadSha: "c2f8a10d9b47",
  },
  {
    id: "find_sample_3",
    pullId: pulls[0]!.id,
    title: "Timeout names now match two error classes",
    body: "Both names are thrown by the gateway client, so the wider check is intended.",
    severity: "low",
    status: "open",
    path: pullFiles[2]!.path,
    line: 5,
    createdAt: isoMinutesAgo(21),
    kind: "note",
    confidence: null,
    summary: "Timeout names now match two error classes",
    detail:
      "Both names are thrown by the gateway client, so the wider check is intended.",
    suggestion: null,
    file: pullFiles[2]!.path,
    startLine: 4,
    observingHeadSha: "c2f8a10d9b47",
  },
  {
    id: "find_sample_4",
    pullId: pulls[0]!.id,
    title: "Check the order total rounding before retrying",
    body: "Retries reuse the rounded total from the first attempt.",
    severity: "high",
    status: "open",
    path: "src/checkout/totals.ts",
    line: 12,
    createdAt: isoMinutesAgo(20),
    kind: "issue",
    confidence: "investigate",
    summary: "Check the order total rounding before retrying",
    detail: "Retries reuse the rounded total from the first attempt.",
    suggestion: null,
    file: "src/checkout/totals.ts",
    startLine: null,
    observingHeadSha: "c2f8a10d9b47",
  },
];

export const pullActivity = [
  {
    id: "act_sample_1",
    pullId: pulls[0]!.id,
    type: "review",
    actorId: people.jordan.id,
    body: "approved the pull request",
    createdAt: isoMinutesAgo(18),
  },
  {
    id: "act_sample_2",
    pullId: pulls[0]!.id,
    type: "comment",
    actorId: people.priya.id,
    body: "left a comment on src/checkout/retry.ts",
    createdAt: isoMinutesAgo(28),
  },
  {
    id: "act_sample_3",
    pullId: pulls[1]!.id,
    type: "commit",
    actorId: people.alex.id,
    body: "pushed 2 commits to feat/dark-mode",
    createdAt: isoMinutesAgo(40),
  },
];

export const orgPullActivity = [
  ...pullActivity,
  {
    id: "act_sample_4",
    pullId: pulls[2]!.id,
    type: "merge",
    actorId: people.casey.id,
    body: "merged the pull request",
    createdAt: isoMinutesAgo(9 * 24 * 60),
  },
];

export const pullHourlyActivity = [
  {
    hour: isoMinutesAgo(5 * 60).slice(0, 13),
    opened: 2,
    merged: 1,
    reviewed: 3,
  },
  {
    hour: isoMinutesAgo(4 * 60).slice(0, 13),
    opened: 1,
    merged: 0,
    reviewed: 2,
  },
  {
    hour: isoMinutesAgo(3 * 60).slice(0, 13),
    opened: 0,
    merged: 1,
    reviewed: 4,
  },
  {
    hour: isoMinutesAgo(2 * 60).slice(0, 13),
    opened: 3,
    merged: 1,
    reviewed: 1,
  },
  { hour: isoMinutesAgo(60).slice(0, 13), opened: 1, merged: 0, reviewed: 2 },
];

export const pullSummaries = pulls.map((pull) => ({
  id: `sum_sample_${pull.number}`,
  pullId: pull.id,
  title: pull.title,
  summary:
    pull.state === "draft"
      ? "Draft changes to retry failed gateway requests with a bounded attempt count."
      : `${pull.title} updates ${pull.headRef} and closes its linked issue.`,
  keyChanges: [
    `Retry gateway timeouts up to twice before failing the request`,
    `Cover the retry path with a checkout integration test`,
  ],
  generatedAt: isoMinutesAgo(pull.number === 128 ? 20 : 35),
  modelId: "anthropic/claude-sonnet",
}));

export const pullReviewSkip = {
  pullId: pulls[0]!.id,
  skipped: true,
  reason: "Documentation-only changes in the linked thread",
  skippedBy: people.alex.id,
  skippedAt: isoMinutesAgo(15),
};

export const pullReview = {
  pullId: pulls[0]!.id,
  state: "review_required",
  decision: "changes_requested",
  submittedReviews: pullReviews.length,
  requiredApprovals: 1,
  currentUserReview: {
    state: "changes_requested",
    submittedAt: pullReviews[1]!.submittedAt,
  },
};

export const pullStackRelatives = [
  {
    pullId: pulls[1]!.id,
    number: pulls[1]!.number,
    title: pulls[1]!.title,
    relationship: "parent",
    state: pulls[1]!.state,
  },
  {
    pullId: pulls[3]!.id,
    number: pulls[3]!.number,
    title: pulls[3]!.title,
    relationship: "child",
    state: pulls[3]!.state,
  },
];

export const pullStackTree = {
  rootPullId: pulls[0]!.id,
  nodes: [
    {
      pullId: pulls[0]!.id,
      number: pulls[0]!.number,
      title: pulls[0]!.title,
      parentId: null,
      state: pulls[0]!.state,
    },
    ...pullStackRelatives.map((relative) => ({
      pullId: relative.pullId,
      number: relative.number,
      title: relative.title,
      parentId: pulls[0]!.id,
      state: relative.state,
    })),
  ],
};

export const pullBranches = [
  {
    name: "feat/dark-mode",
    repo: repos[0]!.fullName,
    pullId: pulls[0]!.id,
    pullNumber: pulls[0]!.number,
    ahead: 2,
    behind: 0,
    updatedAt: pulls[0]!.updatedAt,
  },
  {
    name: "fix/checkout-timeout",
    repo: repos[0]!.fullName,
    pullId: pulls[1]!.id,
    pullNumber: pulls[1]!.number,
    ahead: 1,
    behind: 0,
    updatedAt: pulls[1]!.updatedAt,
  },
  {
    name: "feat/orders-cursor",
    repo: repos[1]!.fullName,
    pullId: pulls[3]!.id,
    pullNumber: pulls[3]!.number,
    ahead: 3,
    behind: 1,
    updatedAt: pulls[3]!.updatedAt,
  },
];

export const viewedPullFiles = [
  { path: pullFiles[0]!.path, viewed: true, viewedAt: isoMinutesAgo(16) },
  { path: pullFiles[1]!.path, viewed: false, viewedAt: null },
  { path: pullFiles[2]!.path, viewed: false, viewedAt: null },
];

export const pullFileUrls = pullFiles.map((file, index) => ({
  path: file.path,
  url: `https://github.com/acme/web/pull/128/files#diff-${index + 1}`,
  sha: index === 0 ? "c2f8a10d9b47" : "9d41be73a006",
}));

export const pullImage = {
  url: "https://example.com/acme/web/pull/128/screenshot.png",
  alt: "Settings screen with the dark mode toggle enabled",
  width: 1200,
  height: 720,
};

export const pullCommits = [
  {
    sha: "c2f8a10d9b47",
    message: "Retry gateway timeouts on checkout",
    authorId: people.alex.id,
    authorLogin: people.alex.githubLogin,
    committedAt: isoMinutesAgo(45),
  },
  {
    sha: "9d41be73a006",
    message: "Add checkout retry coverage",
    authorId: people.alex.id,
    authorLogin: people.alex.githubLogin,
    committedAt: isoMinutesAgo(40),
  },
];

export const pullCommitDiff = {
  sha: pullCommits[0]!.sha,
  ...pullFiles[0]!,
};

export const pullCompareDiff = {
  base: "main",
  head: "feat/dark-mode",
  baseSha: "a10f42e8c933",
  headSha: pullCommits[0]!.sha,
  files: pullFiles,
};

export const pullDiff = {
  baseRef: pulls[0]!.baseRef,
  headRef: pulls[0]!.headRef,
  baseSha: "a10f42e8c933",
  headSha: pullCommits[0]!.sha,
  files: pullFiles,
  additions: pullFiles.reduce((total, file) => total + file.additions, 0),
  deletions: pullFiles.reduce((total, file) => total + file.deletions, 0),
};

export const pullDetail = (pullId: string) => {
  const detail = pullDetails.find((candidate) => candidate.id === pullId);
  if (!detail) return undefined;
  const author = authorOf(pulls.find((pull) => pull.id === pullId)!.authorId)!;
  return {
    ...detail,
    authorName: `${author.firstName} ${author.lastName}`,
    authorAvatarUrl: `https://example.com/avatars/${author.id}.png`,
  };
};
