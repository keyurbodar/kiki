import {
  isoMinutesAgo,
  issueLabels,
  issues,
  people,
  pulls,
  repos,
  threads,
  xinPull,
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
  readonly requestId?: string;
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

/**
 * The parity captures open `/pull/keyurbodar/xin/118`, so this pull carries its
 * own detail rows: checks, reviewers, labels, activity, diff and body. Every
 * row below is keyed by `xinPull.id` so the generic sample rows stay untouched.
 */

export const xinPullBody = `Retries were counted in attempts, so a dependency that timed out slowly could hold a request for three full socket timeouts before the caller saw the error. This replaces the counter with a **time budget**: every attempt charges the budget for the error class that it hit, and the loop stops once the budget is spent.

### What changed

- \`src/retry/policy.ts\` adds \`createBudget\`, a small token bucket keyed by error class.
- \`src/retry/budget.ts\` charges the budget instead of decrementing a counter.
- \`src/retry/attempts.ts\` is deleted; \`options.attempts\` still caps the loop.
- \`src/http/backoff.ts\` derives jitter from the remaining budget, not the attempt index.

### Cost table

| Error class | Cost | Why |
| --- | --- | --- |
| Timeout | 2 tokens | The slow case this refactor is for |
| Retryable503 | 2 tokens | Same socket wait as a timeout |
| RateLimited | 1 token | The server already asked us to slow down |

The default budget is 6 tokens inside a 30 second window, which reproduces the old three-attempt ceiling for callers that pass nothing at all.

### Verification

1. \`bun test test/retry\` — 41 passing
2. \`bun run typecheck\` — clean after the header fix in \`src/http/client.ts\`
3. Sandbox gateway with a 503 storm: the request fails at 29.4s instead of 45s

Closes XIN-204.`;

export const xinPullFiles = [
  {
    path: "src/retry/budget.ts",
    status: "modified",
    additions: 10,
    deletions: 4,
    diff: `@@ -1,8 +1,9 @@
-import { attemptsLeft } from "./attempts";
+import { createBudget } from "./policy";
 import { isRetryable } from "./errors";
 import { wait } from "./wait";
 
 const defaultRetries = 3;
 
 export const requestWithRetry = async <T>(
   send: () => Promise<T>,
@@ -19,14 +20,20 @@
   options: RetryOptions = {},
 ): Promise<T> => {
-  let left = options.retries ?? defaultRetries;
+  const budget = createBudget(options);
 
   for (;;) {
-    if (left-- <= 0) throw new RetryExhausted();
+    if (budget.spent()) throw new RetryExhausted(budget.report());
     try {
       return await send();
     } catch (error) {
       if (!isRetryable(error)) throw error;
-      await wait(backoffFor(left));
+      await budget.charge(error);
     }
   }
 };
+
+export const budgetReport = (options: RetryOptions = {}) =>
+  createBudget(options).report();
+
+export const remaining = (options: RetryOptions = {}) =>
+  createBudget(options).remaining();
`,
  },
  {
    path: "src/retry/attempts.ts",
    status: "deleted",
    additions: 0,
    deletions: 13,
    diff: `@@ -1,13 +0,0 @@
-import { RetryExhausted } from "./errors";
-
-const defaultRetries = 3;
-
-export const attemptsLeft = (options: RetryOptions) =>
-  options.retries ?? defaultRetries;
-
-export const attemptsFor = (error: unknown) =>
-  error instanceof RetryExhausted ? 0 : defaultRetries;
-
-export const legacyCap = defaultRetries;
-
-// Callers should move to createBudget in ./policy.ts.
`,
  },
  {
    path: "src/http/backoff.ts",
    status: "modified",
    additions: 8,
    deletions: 4,
    diff: `@@ -3,11 +3,15 @@
 import { budgetFor } from "../retry/policy";
 
-export const backoffFor = (attempt: number) =>
-  Math.min(200 * 2 ** attempt, 5_000) + jitter(attempt * 20);
+const ceilingMs = 5_000;
+
+export const backoffFor = (remaining: number, attempt: number) => {
+  const base = Math.min(200 * 2 ** attempt, ceilingMs);
+  return Math.min(base + jitter(remaining), remaining);
+};
 
-export const jitter = (spread: number) =>
-  Math.round(Math.random() * spread);
+export const jitter = (remaining: number) =>
+  Math.round(Math.random() * Math.min(remaining, 250));
`,
  },
  {
    path: "src/http/client.ts",
    status: "modified",
    additions: 4,
    deletions: 3,
    diff: `@@ -12,10 +12,13 @@
 export const send = async (request: Request, options: SendOptions) => {
   const url = normalizeUrl(request.url);
   const headers = {
-    "content-type": request.headers["content-type"],
-    accept: request.headers.accept,
-    "x-request-id": request.headers["x-request-id"],
+    "content-type": request.headers["content-type"] ?? "application/json",
+    accept: request.headers.accept ?? "application/json",
+    "x-request-id": request.headers["x-request-id"] ?? newId(),
+    "x-retry-budget": String(options.budget ?? 6),
   };
   return fetch(url, { ...request, headers });
 };
`,
  },
  {
    path: "src/retry/policy.ts",
    status: "added",
    additions: 22,
    deletions: 0,
    diff: `@@ -0,0 +1,22 @@
+import { RateLimited, Retryable503, Timeout } from "./errors";
+
+const costs = new Map<string, number>([
+  [Timeout.name, 2],
+  [Retryable503.name, 2],
+  [RateLimited.name, 1],
+]);
+
+export const createBudget = (options: RetryOptions = {}) => {
+  const total = options.budget ?? options.attempts ?? 6;
+  const windowMs = options.windowMs ?? 30_000;
+  const openedAt = Date.now();
+  let spent = 0;
+
+  const charge = async (error: unknown) => {
+    const cost = costs.get(errorName(error)) ?? 1;
+    spent += cost;
+    await wait(backoffFor(windowMs - (Date.now() - openedAt), spent));
+  };
+
+  return { charge, report, remaining, spent };
+};
`,
  },
  {
    path: "test/retry/budget.test.ts",
    status: "added",
    additions: 24,
    deletions: 0,
    diff: `@@ -0,0 +1,21 @@
+import { describe, expect, it } from "bun:test";
+import { createBudget } from "../../src/retry/policy";
+
+describe("retry budget", () => {
+  it("stops a timeout storm after three attempts", async () => {
+    const budget = createBudget();
+    await budget.charge(new Timeout("slow gateway"));
+    await budget.charge(new Timeout("slow gateway"));
+    await budget.charge(new Timeout("slow gateway"));
+    expect(budget.spent()).toBe(true);
+  });
+
+  it("lets a rate limited call retry more often than a timeout", async () => {
+    const budget = createBudget();
+    await budget.charge(new RateLimited("429"));
+    await budget.charge(new RateLimited("429"));
+    await budget.charge(new RateLimited("429"));
+    expect(budget.remaining()).toBe(3);
+  });
+
+  it("keeps the legacy ceiling when a caller passes attempts", () => {
+    expect(createBudget({ attempts: 3 }).costOf("timeout")).toBe(2);
+  });
+});
`,
  },
  {
    path: "docs/retry-policy.md",
    status: "added",
    additions: 12,
    deletions: 0,
    diff: `@@ -0,0 +1,12 @@
+# Retry policy
+
+Every outbound call charges a shared budget instead of counting attempts.
+
+| Class | Cost | Default budget |
+| --- | --- | --- |
+| Timeout | 2 | 6 tokens |
+| Retryable503 | 2 | 6 tokens |
+| RateLimited | 1 | 6 tokens |
+
+Pass \`windowMs\` to bound how long a retry loop may run. The default window is
+30 seconds, which matches the old three-attempt ceiling for a 10 second timeout.
`,
  },
] as const;

export const xinPullDiff = {
  baseRef: xinPull.baseRef,
  headRef: xinPull.headRef,
  baseSha: "8c1de40a7f93",
  headSha: "4f0c9ab17d55",
  files: xinPullFiles,
  additions: xinPull.additions,
  deletions: xinPull.deletions,
};

export const xinPullFileUrls = xinPullFiles.map((file, index) => ({
  path: file.path,
  url: `https://github.com/${xinPull.repo}/pull/${xinPull.number}/files#diff-${index + 1}`,
  sha: xinPullDiff.headSha,
}));

export const xinPullViewedFiles = xinPullFiles.map((file) => ({
  path: file.path,
  viewed: file.path === "src/retry/attempts.ts",
  viewedAt: file.path === "src/retry/attempts.ts" ? isoMinutesAgo(880) : null,
}));

export const xinPullChecks = [
  {
    id: "check_xin_118_build",
    name: "CI / build",
    status: "completed",
    conclusion: "success",
    durationSeconds: 208,
    detailsUrl: `https://github.com/${xinPull.repo}/actions/runs/1184`,
    startedAt: isoMinutesAgo(38),
    completedAt: isoMinutesAgo(34),
  },
  {
    id: "check_xin_118_unit",
    name: "CI / unit tests",
    status: "completed",
    conclusion: "success",
    durationSeconds: 96,
    detailsUrl: `https://github.com/${xinPull.repo}/actions/runs/1184`,
    startedAt: isoMinutesAgo(38),
    completedAt: isoMinutesAgo(36),
  },
  {
    id: "check_xin_118_typecheck",
    name: "CI / typecheck",
    status: "completed",
    conclusion: "failure",
    durationSeconds: 44,
    detailsUrl: `https://github.com/${xinPull.repo}/actions/runs/1184`,
    startedAt: isoMinutesAgo(38),
    completedAt: isoMinutesAgo(37),
  },
  {
    id: "check_xin_118_lint",
    name: "CI / lint",
    status: "completed",
    conclusion: "success",
    durationSeconds: 31,
    detailsUrl: `https://github.com/${xinPull.repo}/actions/runs/1184`,
    startedAt: isoMinutesAgo(38),
    completedAt: isoMinutesAgo(37),
  },
  {
    id: "check_xin_118_e2e",
    name: "CI / e2e (web)",
    status: "in_progress",
    conclusion: null,
    durationSeconds: null,
    detailsUrl: `https://github.com/${xinPull.repo}/actions/runs/1189`,
    startedAt: isoMinutesAgo(9),
    completedAt: null,
  },
  {
    id: "check_xin_118_review",
    name: "Review / findings",
    status: "in_progress",
    conclusion: null,
    durationSeconds: null,
    detailsUrl: null,
    startedAt: isoMinutesAgo(6),
    completedAt: null,
  },
];

export const xinPullReviewers = [
  {
    id: people.priya.id,
    login: people.priya.githubLogin,
    name: `${people.priya.firstName} ${people.priya.lastName}`,
    role: "reviewer",
    state: "approved",
    reviewState: "approved",
    approved: true,
  },
  {
    id: people.jordan.id,
    login: people.jordan.githubLogin,
    name: `${people.jordan.firstName} ${people.jordan.lastName}`,
    role: "reviewer",
    state: "changes_requested",
    reviewState: "changes_requested",
    approved: false,
  },
  {
    id: people.casey.id,
    login: people.casey.githubLogin,
    name: `${people.casey.firstName} ${people.casey.lastName}`,
    role: "reviewer",
    state: "pending",
    reviewState: null,
    approved: false,
  },
];

export const xinPullLabels = issueLabels
  .filter(
    (label) =>
      label.id === "lbl_sample_feature" || label.id === "lbl_sample_perf",
  )
  .map((label) => ({ id: label.id, name: label.name, color: label.color }));

export const xinPullCommits = [
  {
    sha: "a91d4e6c7b02",
    message: "Add a retry budget with a token bucket",
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    committedAt: isoMinutesAgo(7100),
  },
  {
    sha: "b47c90e1d3a8",
    message: "Charge the budget per error class",
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    committedAt: isoMinutesAgo(4900),
  },
  {
    sha: "c5318fb62e40",
    message: "Keep the legacy attempt cap behind an option",
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    committedAt: isoMinutesAgo(2820),
  },
  {
    sha: "d0f27a5be913",
    message: "Document the cost table and window default",
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    committedAt: isoMinutesAgo(900),
  },
  {
    sha: "4f0c9ab17d55",
    message: "Fix default header types in the http client",
    authorId: people.sam.id,
    authorLogin: people.sam.githubLogin,
    committedAt: isoMinutesAgo(120),
  },
];

export const xinPullComments = [
  {
    id: "cmt_xin_118_1",
    kind: "review",
    author: people.jordan.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.jordan.id}.png`,
    authoredAt: isoMinutesAgo(2700),
    bodyMd:
      "`charge` counts a 429 as one token and a 503 as two, so a rate limited dependency drains the budget at half the speed of a flapping one. The comment above the method says the opposite.",
    edited: false,
    resolved: false,
    outdated: false,
    file: "src/retry/budget.ts",
    line: 31,
    githubReviewId: "ghr_xin_118_jordan",
  },
  {
    id: "cmt_xin_118_2",
    kind: "issue",
    author: people.priya.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.priya.id}.png`,
    authoredAt: isoMinutesAgo(2650),
    bodyMd:
      "The budget is much easier to reason about than the counter. One question: `createBudget` reads `options.windowMs` but never clamps it, so a caller can pass an hour and turn a 503 storm into a very long hang.",
    edited: true,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_3",
    kind: "issue",
    author: people.casey.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.casey.id}.png`,
    authoredAt: isoMinutesAgo(1800),
    bodyMd:
      "Does this change the default for existing callers? Six call sites lean on the three attempt cap and none of them pass options.",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_4",
    kind: "issue",
    author: people.sam.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.sam.id}.png`,
    authoredAt: isoMinutesAgo(880),
    bodyMd:
      "The default is unchanged: `createBudget` falls back to three attempts inside a 30 second window, so the six call sites keep their old ceiling unless they opt into a shared budget. The cost table is in `docs/retry-policy.md` now.",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_5",
    kind: "issue",
    author: "ci-checks",
    authorAvatarUrl: null,
    authoredAt: isoMinutesAgo(700),
    bodyMd:
      "Checks updated on `4f0c9ab`.\n\n- CI / build — passed (3m 28s)\n- CI / unit tests — passed (1m 36s)\n- CI / lint — passed (31s)\n- CI / typecheck — failed (44s)\n- CI / e2e (web) — running\n\n[View the run](https://github.com/keyurbodar/xin/actions/runs/1184)",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_6",
    kind: "issue",
    author: people.sam.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.sam.id}.png`,
    authoredAt: isoMinutesAgo(130),
    bodyMd:
      "Pushed `4f0c9ab` with default header types in the http client. Typecheck passes locally now; waiting on the rerun before I ask for a final look.",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_7",
    kind: "issue",
    author: people.jordan.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.jordan.id}.png`,
    authoredAt: isoMinutesAgo(75),
    bodyMd:
      "Re-running the typecheck job now. Nothing in this diff touches the header types that broke it, so I am not blocking on that job.",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
  {
    id: "cmt_xin_118_8",
    kind: "issue",
    author: people.priya.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.priya.id}.png`,
    authoredAt: isoMinutesAgo(40),
    bodyMd:
      "Left the window clamp as a follow-up in XIN-211 rather than widening this pull. Everything else reads well.",
    edited: false,
    resolved: false,
    outdated: false,
    file: null,
    line: null,
    githubReviewId: null,
  },
];

export const xinPullReviews = [
  {
    id: "ghr_xin_118_jordan",
    githubReviewId: "ghr_xin_118_jordan",
    author: people.jordan.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.jordan.id}.png`,
    submittedAt: isoMinutesAgo(2700),
    state: "changes_requested",
    bodyMd:
      "The direction is right — a budget is the correct shape for this loop. Two things before I approve:\n\n1. `charge` weighs a rate limited response as half a timeout, which is backwards; a 429 should cost at least as much as a 503.\n2. The window is read but never clamped.",
    edited: false,
  },
  {
    id: "ghr_xin_118_priya",
    githubReviewId: "ghr_xin_118_priya",
    author: people.priya.githubLogin,
    authorAvatarUrl: `https://example.com/avatars/${people.priya.id}.png`,
    submittedAt: isoMinutesAgo(600),
    state: "approved",
    bodyMd:
      "Approved. The typecheck failure is in the client header types, not the retry path, and that job has been red on main since Monday.",
    edited: false,
  },
];

export const xinPullActivity = {
  pullId: xinPull.id,
  commits: xinPullCommits,
  comments: xinPullComments,
  reviews: xinPullReviews,
};

export const xinPullFindings = [
  {
    id: "find_xin_118_1",
    pullId: xinPull.id,
    requestId: "req_xin_118_1",
    title: "Clamp the budget window",
    body: "A caller can pass an hour long window, which turns a 503 storm into a very long hang.",
    severity: "medium",
    status: "open",
    path: "src/retry/policy.ts",
    line: 12,
    startLine: 11,
    createdAt: isoMinutesAgo(2390),
    kind: "issue",
    confidence: "confident",
    summary: "Clamp the budget window",
    detail:
      "A caller can pass an hour long window, which turns a 503 storm into a very long hang.",
    suggestion:
      "  const windowMs = Math.min(options.windowMs ?? 30_000, 60_000);",
    file: "src/retry/policy.ts",
    observingHeadSha: "d0f27a5be913",
  },
  {
    id: "find_xin_118_2",
    pullId: xinPull.id,
    requestId: "req_xin_118_1",
    title: "Charge a rate limited response like a timeout",
    body: "The cost table gives a 429 half the weight of a 503, so the slowest dependency drains the budget last.",
    severity: "low",
    status: "resolved",
    path: "src/retry/policy.ts",
    line: 6,
    startLine: null,
    createdAt: isoMinutesAgo(2385),
    kind: "note",
    confidence: null,
    summary: "Charge a rate limited response like a timeout",
    detail:
      "The cost table gives a 429 half the weight of a 503, so the slowest dependency drains the budget last.",
    suggestion: null,
    file: "src/retry/policy.ts",
    observingHeadSha: "d0f27a5be913",
  },
];

export const xinPullReview = {
  threadId: null,
  reviewedHeadSha: "d0f27a5be913",
  rounds: [
    {
      requestId: "req_xin_118_1",
      headSha: "d0f27a5be913",
      status: "completed",
      title: "Two findings on the retry budget",
      failureMessage: null,
      failureReason: null,
      createdAt: isoMinutesAgo(2400),
      settledAt: isoMinutesAgo(2390),
    },
  ],
};

export const xinPullHeadSha = xinPullCommits.at(-1)!.sha;
