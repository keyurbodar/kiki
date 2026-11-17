import {
  isoMinutesAgo,
  type ProjectRef,
  people,
  projects,
  threads,
} from "../fixtures/world.ts";

/**
 * Extra neutral pulls for the /pulls list, in the same row shape as
 * `world.pulls`, plus a checks state so every list section has members.
 * The pulls mock serves `world.pulls` (through MockDb) and these together.
 */
export interface PullRow {
  readonly id: string;
  readonly repo: string;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly authorId: string;
  readonly headRef: string;
  readonly baseRef: string;
  readonly additions: number;
  readonly deletions: number;
  readonly threadId: string | null;
  readonly updatedAt: string;
}

export interface PullExtras {
  readonly checksState?: "none" | "pending" | "passed" | "failed";
  readonly createdMinutesAgo?: number;
}

type Seed = readonly [
  repo: string,
  number: number,
  title: string,
  state: "ready" | "pending" | "failed" | "draft" | "merged" | "closed",
  author: keyof typeof people,
  additions: number,
  deletions: number,
  thread: keyof typeof threads | null,
  updatedMinutesAgo: number,
];

const seeds: ReadonlyArray<Seed> = [
  ["acme/web", 140, "settings: group notification toggles by channel", "ready", "sam", 214, 38, "darkMode", 70],
  ["acme/web", 139, "checkout: keep the cart when the session refreshes", "ready", "alex", 96, 21, "checkoutTest", 95],
  ["acme/api", 64, "orders: add an index on customer and created date", "ready", "jordan", 31, 4, "paginate", 120],
  ["acme/web", 137, "search: debounce the query box and cancel stale requests", "ready", "priya", 58, 17, null, 150],
  ["acme/shared", 22, "ui: share the date formatter between web and api docs", "ready", "casey", 143, 89, "bundler", 180],
  ["acme/api", 63, "rate limit: return Retry-After on throttled requests", "ready", "sam", 77, 12, "rateLimit", 210],
  ["acme/docs", 18, "quickstart: add the CLI install step for Windows", "ready", "priya", 24, 3, "gettingStarted", 240],
  ["acme/web", 136, "nav: remember the collapsed sidebar per device", "ready", "jordan", 45, 9, null, 270],
  ["acme/api", 62, "webhooks: sign payloads with a rotating secret", "ready", "alex", 388, 61, "rateLimit", 300],
  ["acme/web", 134, "billing: show the next invoice date on the plan card", "ready", "casey", 67, 14, null, 330],
  ["acme/web", 138, "images: lazy load product thumbnails below the fold", "failed", "sam", 52, 6, "checkoutTest", 60],
  ["acme/api", 61, "auth: refresh tokens before they expire mid-request", "failed", "jordan", 119, 47, null, 160],
  ["acme/web", 135, "a11y: label the icon-only buttons in the toolbar", "pending", "priya", 33, 2, null, 35],
  ["acme/shared", 21, "lint: turn on the unused import rule", "pending", "alex", 12, 40, "bundler", 85],
  ["acme/docs", 17, "api reference: document the pagination cursor", "draft", "casey", 140, 0, "paginate", 400],
  ["acme/web", 133, "experiment: inline editing for the profile name", "draft", "jordan", 201, 55, null, 600],
  ["acme/web", 130, "cart: show the saved items count in the header", "merged", "sam", 74, 11, null, 1500],
  ["acme/api", 60, "orders: return totals in the customer's currency", "merged", "alex", 162, 30, "paginate", 2100],
  ["acme/web", 127, "remove the old onboarding banner", "closed", "priya", 0, 88, null, 2900],
];

export const extraPulls: ReadonlyArray<PullRow & PullExtras> = seeds.map(
  ([repo, number, title, state, author, additions, deletions, thread, updated]) => ({
    id: `pr_sample_${repo.replace("acme/", "")}_${number}`,
    repo,
    number,
    title,
    state,
    authorId: people[author].id,
    headRef: `${people[author].githubLogin}/pull-${number}`,
    baseRef: "main",
    additions,
    deletions,
    threadId: thread === null ? null : threads[thread].id,
    updatedAt: isoMinutesAgo(updated),
    createdMinutesAgo: updated + 24 * 60,
  }),
);

/** Repo full name → project, from the world's project table. */
export const projectByRepo = new Map<string, ProjectRef>(
  Object.values(projects).flatMap((project) =>
    project.repos.map((repo) => [repo, project] as const),
  ),
);

export const threadById = new Map<string, ThreadRef>(
  Object.values(threads).map((thread) => [thread.id, thread] as const),
);

interface ThreadRef {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly projectId: string | null;
}

export const branchesByRepo: Readonly<Record<string, ReadonlyArray<string>>> = {
  "acme/web": ["main", "feat/dark-mode", "fix/checkout-timeout", "chore/bundler-upgrade", "feat/saved-items"],
  "acme/api": ["main", "feat/orders-cursor", "fix/token-refresh", "feat/webhook-signing"],
  "acme/shared": ["main", "chore/unused-imports", "feat/date-format"],
  "acme/docs": ["main", "docs/quickstart", "docs/pagination"],
  "acme/legacy-site": ["master"],
};
