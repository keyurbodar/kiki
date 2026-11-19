import { DateTime } from "effect";
import { fixtureNow } from "./time.ts";

/**
 * One coherent fake organization that every mock group draws from. Records are
 * plain JSON so they can back endpoints whose schemas are still `Undecoded`.
 * Ids match the decoded fixtures in organizations/, users/, projects/ and jams/.
 */

export const isoMinutesAgo = (minutes: number) =>
  DateTime.formatIso(DateTime.subtract(fixtureNow, { minutes }));

const hour = 60;
const day = 24 * hour;

export const orgId = "org_sample_acme";
export const otherOrgId = "org_sample_lab";

export const org = {
  id: orgId,
  name: "Acme",
  slug: "acme",
  issuePrefix: "ACME",
  domain: "example.com",
  createdAt: isoMinutesAgo(90 * day),
} as const;

export type Role = "owner" | "admin" | "member";

/** Capy's Captain avatar presets, which double as the demo org's faces. */
const personAvatars = Object.values(
  import.meta.glob<string>("../../../assets/brand/avatars/capy-avatar-*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();

let personAvatarIndex = 0;
const nextAvatar = () => {
  const url = personAvatars[personAvatarIndex % personAvatars.length];
  personAvatarIndex += 1;
  return url ?? null;
};

/**
 * The members who signed in with a photo. Everyone else keeps Capy's initials
 * tile, which is the state a real org is mostly in.
 */
const facedFirstNames = new Set(["Alex", "Sam", "Priya", "Jordan"]);

export interface Person {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly githubLogin: string;
  /** The face the member directory resolves an id to; Capy's member rows carry it as `imageUrl`. */
  readonly imageUrl: string | null;
  readonly role: Role;
  readonly joinedAt: string;
}

const person = (
  firstName: string,
  lastName: string,
  role: Role,
  joinedDaysAgo: number,
): Person => ({
  id: `user_sample_${firstName.toLowerCase()}`,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}@example.com`,
  githubLogin: `${firstName.toLowerCase()}-sample`,
  imageUrl: facedFirstNames.has(firstName) ? nextAvatar() : null,
  role,
  joinedAt: isoMinutesAgo(joinedDaysAgo * day),
});

const capturedAuthor = (displayName: string): Person => ({
  id: `user_sample_captured_${displayName.toLowerCase().replace(/[^a-z0-9]+/gu, "_")}`,
  firstName: displayName,
  lastName: "",
  email: "",
  githubLogin: "",
  imageUrl: null,
  role: "member",
  joinedAt: isoMinutesAgo(90 * day),
});

export const people = {
  alex: person("Alex", "Morgan", "owner", 90),
  sam: person("Sam", "Rivera", "admin", 80),
  priya: person("Priya", "Shah", "member", 45),
  jordan: person("Jordan", "Lee", "member", 20),
  casey: person("Casey", "Nguyen", "member", 3),
  Net: capturedAuthor(".NET"),
  Aws: capturedAuthor("AWS"),
  AddyOsmani: capturedAuthor("Addy Osmani"),
  AffaanMustafa: capturedAuthor("Affaan Mustafa"),
  Angular: capturedAuthor("Angular"),
  Anthropic: capturedAuthor("Anthropic"),
  ApolloGraphql: capturedAuthor("Apollo GraphQL"),
  Appwrite: capturedAuthor("Appwrite"),
  Buildkite: capturedAuthor("Buildkite"),
  Callstack: capturedAuthor("Callstack"),
  Clerk: capturedAuthor("Clerk"),
  Clickhouse: capturedAuthor("ClickHouse"),
  Cloudflare: capturedAuthor("Cloudflare"),
  CockroachLabs: capturedAuthor("Cockroach Labs"),
  Convex: capturedAuthor("Convex"),
  Dynatrace: capturedAuthor("Dynatrace"),
  Elastic: capturedAuthor("Elastic"),
  EmilKowalski: capturedAuthor("Emil Kowalski"),
  Expo: capturedAuthor("Expo"),
  Firebase: capturedAuthor("Firebase"),
  Firecrawl: capturedAuthor("Firecrawl"),
  Flutter: capturedAuthor("Flutter"),
  Google: capturedAuthor("Google"),
  GoogleCloud: capturedAuthor("Google Cloud"),
  GrafanaLabs: capturedAuthor("Grafana Labs"),
  Hashicorp: capturedAuthor("HashiCorp"),
  Inngest: capturedAuthor("Inngest"),
  Livekit: capturedAuthor("LiveKit"),
  MattPocock: capturedAuthor("Matt Pocock"),
  Microsoft: capturedAuthor("Microsoft"),
  Mongodb: capturedAuthor("MongoDB"),
  MuratCanKoylan: capturedAuthor("Murat Can Koylan"),
  Neon: capturedAuthor("Neon"),
  Netlify: capturedAuthor("Netlify"),
  Openai: capturedAuthor("OpenAI"),
  Posthog: capturedAuthor("PostHog"),
  Prisma: capturedAuthor("Prisma"),
  Pulumi: capturedAuthor("Pulumi"),
  Railway: capturedAuthor("Railway"),
  Resend: capturedAuthor("Resend"),
  Revenuecat: capturedAuthor("RevenueCat"),
  Sentry: capturedAuthor("Sentry"),
  SethHobson: capturedAuthor("Seth Hobson"),
  Stripe: capturedAuthor("Stripe"),
  Supabase: capturedAuthor("Supabase"),
  Svelte: capturedAuthor("Svelte"),
  Tavily: capturedAuthor("Tavily"),
  Temporal: capturedAuthor("Temporal"),
  TrailOfBits: capturedAuthor("Trail of Bits"),
  Twilio: capturedAuthor("Twilio"),
  Upstash: capturedAuthor("Upstash"),
  Vercel: capturedAuthor("Vercel"),
  Workos: capturedAuthor("WorkOS"),
} as const;

export const viewer = people.alex;
export const members: ReadonlyArray<Person> = Object.values(people);

export const pendingInvitations = [
  {
    id: "inv_sample_taylor",
    email: "taylor@example.com",
    role: "member" as Role,
    invitedBy: people.sam.id,
    createdAt: isoMinutesAgo(2 * day),
    expiresAt: isoMinutesAgo(-5 * day),
  },
];

export const serviceUsers = [
  {
    id: "svc_sample_release",
    name: "Release bot",
    description: "Tags releases and writes the changelog.",
    createdBy: people.sam.id,
    createdAt: isoMinutesAgo(30 * day),
  },
];

export interface ProjectRef {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly repos: ReadonlyArray<string>;
}

export const projects = {
  web: {
    id: "proj_sample_web",
    code: "WEB",
    name: "Web app",
    repos: ["acme/web"],
  },
  api: {
    id: "proj_sample_api",
    code: "API",
    name: "API",
    repos: ["acme/api", "acme/shared"],
  },
  docs: {
    id: "proj_sample_docs",
    code: "DOC",
    name: "Docs",
    repos: ["acme/docs"],
  },
  old: {
    id: "proj_sample_old",
    code: "OLD",
    name: "Legacy site",
    repos: ["acme/legacy-site"],
  },
  hiring: {
    id: "proj_sample_hiring",
    code: "HIR",
    name: "Hiring",
    repos: ["acme/hiring"],
  },
} as const satisfies Record<string, ProjectRef>;

export const repos = [
  {
    id: "repo_sample_web",
    fullName: "acme/web",
    defaultBranch: "main",
    private: true,
    language: "TypeScript",
  },
  {
    id: "repo_sample_api",
    fullName: "acme/api",
    defaultBranch: "main",
    private: true,
    language: "Go",
  },
  {
    id: "repo_sample_shared",
    fullName: "acme/shared",
    defaultBranch: "main",
    private: true,
    language: "TypeScript",
  },
  {
    id: "repo_sample_docs",
    fullName: "acme/docs",
    defaultBranch: "main",
    private: false,
    language: "MDX",
  },
  {
    id: "repo_sample_legacy",
    fullName: "acme/legacy-site",
    defaultBranch: "master",
    private: true,
    language: "PHP",
  },
  {
    id: "repo_sample_xin",
    fullName: "keyurbodar/xin",
    defaultBranch: "main",
    private: false,
    language: "TypeScript",
  },
] as const;

export const branches = [
  "main",
  "feat/dark-mode",
  "fix/checkout-timeout",
  "chore/bundler-upgrade",
] as const;

/** Threads already decoded in jams/fixtures.ts, by number. */
export const threads = {
  checkoutTest: {
    id: "jam_sample_0001",
    number: 41,
    title: "Fix flaky checkout test",
    projectId: projects.web.id,
  },
  darkMode: {
    id: "jam_sample_0002",
    number: 40,
    title: "Add dark mode to settings",
    projectId: projects.web.id,
  },
  paginate: {
    id: "jam_sample_0003",
    number: 39,
    title: "Paginate the orders endpoint",
    projectId: projects.api.id,
  },
  rateLimit: {
    id: "jam_sample_0004",
    number: 38,
    title: "Rate limit the public search API",
    projectId: projects.api.id,
  },
  gettingStarted: {
    id: "jam_sample_0005",
    number: 37,
    title: "Write the getting started guide",
    projectId: projects.docs.id,
  },
  incidents: {
    id: "jam_sample_0006",
    number: 36,
    title: "Summarize last week's incidents",
    projectId: null,
  },
  bundler: {
    id: "jam_sample_0007",
    number: 35,
    title: "Upgrade the bundler",
    projectId: projects.web.id,
  },
  /**
   * The jam ids our parity captures navigate to. Their history is seeded in
   * events/fixtures.ts, their cards and children beside the sample rows.
   */
  capturePipeline: {
    id: "jam_01M7FSZ5JHHYSDA2WM61W88WEG",
    number: 48,
    title: "Wire the retry budget into the release pipeline",
    projectId: projects.web.id,
  },
  captureFiles: {
    id: "jam_01M7MFTGG7Q15WKEF7TW3PQG37",
    number: 47,
    title: "Shard the release test suite",
    projectId: projects.web.id,
  },
  captureSideParent: {
    id: "jam_01M7MMQJAA80M4FEDRSNZVFGG5",
    number: 46,
    title: "Plan the pipeline hardening work",
    projectId: projects.web.id,
  },
  captureSideIsolation: {
    id: "jam_capture_side_isolation",
    number: 52,
    title: "Isolate the slow shards",
    projectId: projects.web.id,
  },
  captureSideWatcher: {
    id: "jam_capture_side_watcher",
    number: 53,
    title: "Sketch the release watcher",
    projectId: projects.web.id,
  },
  captureProbe: {
    id: "jam_01M7FP6GKY49R183VW3NBE3Y2Z",
    number: 45,
    title: "Trace the flaky shard timeout",
    projectId: projects.web.id,
  },
  listQueueDepth: {
    id: "jam_sample_list_330",
    number: 600,
    title: "Queue depth per worker on the usage chart",
    projectId: projects.web.id,
  },
  listEmptyState: {
    id: "jam_sample_list_331",
    number: 601,
    title: "Empty state copy for the orders table",
    projectId: projects.web.id,
  },
  listWebhooks: {
    id: "jam_sample_list_332",
    number: 602,
    title: "Webhook delivery log with retries",
    projectId: projects.web.id,
  },
  listRateLimit: {
    id: "jam_sample_list_333",
    number: 603,
    title: "Rate limit the search endpoint per token",
    projectId: projects.web.id,
  },
  listExports: {
    id: "jam_sample_list_334",
    number: 604,
    title: "CSV export of the ledger, streamed",
    projectId: projects.web.id,
  },
  listTimezone: {
    id: "jam_sample_list_335",
    number: 605,
    title: "Store the due date in the org timezone",
    projectId: projects.web.id,
  },
  listAudit: {
    id: "jam_sample_list_336",
    number: 606,
    title: "Audit log rows for label changes",
    projectId: projects.web.id,
  },
  listDrivePaging: {
    id: "jam_sample_list_337",
    number: 607,
    title: "Cursor pagination for the drive listing",
    projectId: projects.web.id,
  },
  listShortcuts: {
    id: "jam_sample_list_338",
    number: 608,
    title: "Keyboard shortcuts for the issues list",
    projectId: projects.web.id,
  },
  listDigest: {
    id: "jam_sample_list_339",
    number: 609,
    title: "Weekly digest email, rendered from the org",
    projectId: projects.web.id,
    archived: true,
  },
  listPreviewRetry: {
    id: "jam_sample_list_340",
    number: 610,
    title: "Preview tunnel retries after a dropped socket",
    projectId: projects.web.id,
  },
  listLimits: {
    id: "jam_sample_list_341",
    number: 611,
    title: "Per-org concurrency limits on machines",
    projectId: projects.web.id,
  },
  listRuntimeBump: {
    id: "jam_sample_list_342",
    number: 612,
    title: "Bump the runtime image to the new base",
    projectId: projects.web.id,
    archived: true,
  },
  listSchemaAudit: {
    id: "jam_sample_list_343",
    number: 613,
    title: "Drop the unused schema columns",
    projectId: projects.web.id,
    archived: true,
  },
  listDraftSearch: {
    id: "jam_sample_list_344",
    number: 614,
    title: "Draft: unified search across drive and issues",
    projectId: projects.web.id,
  },
  listDropLegacy: {
    id: "jam_sample_list_345",
    number: 615,
    title: "Remove the legacy webhook queue",
    projectId: projects.web.id,
    archived: true,
  },
  listMemo: {
    id: "jam_sample_list_346",
    number: 616,
    title: "Memoise the pricing lookups",
    projectId: projects.web.id,
  },
  listInvites: {
    id: "jam_sample_list_347",
    number: 617,
    title: "Invite links carry the project scope",
    projectId: projects.web.id,
  },
  listTheme: {
    id: "jam_sample_list_348",
    number: 618,
    title: "Stop the theme flash on first paint",
    projectId: projects.web.id,
  },
  listUpload: {
    id: "jam_sample_list_349",
    number: 619,
    title: "Cap the upload size before the request",
    projectId: projects.web.id,
  },
  listSaml: {
    id: "jam_sample_list_350",
    number: 620,
    title: "SAML metadata refresh every six hours",
    projectId: projects.web.id,
  },
  listSearch: {
    id: "jam_sample_list_351",
    number: 621,
    title: "Rank search results by recency",
    projectId: projects.web.id,
  },
  listCron: {
    id: "jam_sample_list_352",
    number: 622,
    title: "Run cron schedules in the org timezone",
    projectId: projects.web.id,
  },
  listBilling: {
    id: "jam_sample_list_353",
    number: 623,
    title: "Usage rows carry the billing period",
    projectId: projects.web.id,
  },
} as const;

export type CaptainSeed = {
  readonly id: string;
  readonly name: string;
  readonly alias: string;
  readonly description: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly crew: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly preview?: string | null;
  readonly hasUnreads?: boolean;
  readonly crewMentionCount?: number;
};

export const captains: ReadonlyArray<CaptainSeed> = [
  {
    id: "jam_sample_cap1",
    name: "Release captain",
    alias: "release",
    description: "Runs the weekly web release and its follow-ups.",
    ownerId: people.alex.id,
    projectId: projects.web.id,
    crew: [threads.checkoutTest.id, threads.darkMode.id, threads.bundler.id],
    createdAt: isoMinutesAgo(14 * day),
    preview: "The release branch is cut and its checks are running.",
    hasUnreads: false,
    crewMentionCount: 0,
  },
  {
    id: "jam_sample_cap2",
    name: "Docs captain",
    alias: "docs",
    description: "Keeps the public docs in step with the API.",
    ownerId: people.priya.id,
    projectId: projects.docs.id,
    crew: [threads.gettingStarted.id],
    createdAt: isoMinutesAgo(6 * day),
    preview: "The API reference is regenerated and published.",
    hasUnreads: false,
    crewMentionCount: 0,
  },
  {
    id: "jam_sample_cap3",
    name: "Platform captain",
    alias: "platform",
    description: "Watches the build, the queue and the deploy pipeline.",
    ownerId: people.sam.id,
    projectId: projects.api.id,
    crew: [threads.darkMode.id],
    createdAt: isoMinutesAgo(2 * day),
    preview: "Someone is asking which branch the fix went to.",
    hasUnreads: true,
    crewMentionCount: 1,
  },
] as const;

export type IssueStateCategory =
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export const issueStates = [
  {
    id: "ist_sample_in_review",
    name: "In review",
    category: "started",
    color: "info",
    position: 1,
    isDefault: false,
  },
  {
    id: "ist_sample_in_progress",
    name: "In progress",
    category: "started",
    color: "primary",
    position: 2,
    isDefault: false,
  },
  {
    id: "ist_sample_todo",
    name: "Todo",
    category: "unstarted",
    color: "default",
    position: 4,
    isDefault: true,
  },
  {
    id: "ist_sample_backlog",
    name: "Backlog",
    category: "backlog",
    color: "default",
    position: 5,
    isDefault: false,
  },
  {
    id: "ist_sample_done",
    name: "Done",
    category: "completed",
    color: "success",
    position: 6,
    isDefault: true,
  },
  {
    id: "ist_sample_canceled",
    name: "Canceled",
    category: "canceled",
    color: "default",
    position: 7,
    isDefault: false,
  },
] as const satisfies ReadonlyArray<
  { category: IssueStateCategory } & Record<string, unknown>
>;

export const issueLabels = [
  { id: "lbl_sample_bug", name: "Bug", color: "danger" },
  { id: "lbl_sample_feature", name: "Feature", color: "primary" },
  { id: "lbl_sample_docs", name: "Docs", color: "success" },
  { id: "lbl_sample_perf", name: "Performance", color: "warning" },
] as const;

const issue = (
  number: number,
  title: string,
  stateId: (typeof issueStates)[number]["id"],
  options: {
    readonly projectId?: string;
    readonly assigneeId?: string | null;
    readonly assigneeIds?: ReadonlyArray<string>;
    readonly labelIds?: ReadonlyArray<string>;
    readonly threadIds?: ReadonlyArray<string>;
    readonly pullIds?: ReadonlyArray<string>;
    readonly parentNumber?: number;
    readonly priority?: "urgent" | "high" | "normal" | "low";
    readonly updatedMinutesAgo: number;
  },
) => ({
  id: `iss_sample_${number}`,
  number,
  code: `${org.issuePrefix}-${number}`,
  title,
  stateId,
  projectId: options.projectId ?? projects.web.id,
  assigneeId: options.assigneeId ?? null,
  assigneeIds:
    options.assigneeIds ?? (options.assigneeId ? [options.assigneeId] : []),
  creatorId: people.alex.id,
  labelIds: options.labelIds ?? [],
  threadIds: options.threadIds ?? [],
  pullIds: options.pullIds ?? [],
  parentCode: options.parentNumber
    ? `${org.issuePrefix}-${options.parentNumber}`
    : null,
  priority: options.priority ?? "normal",
  createdAt: isoMinutesAgo(options.updatedMinutesAgo + 3 * day),
  updatedAt: isoMinutesAgo(options.updatedMinutesAgo),
});

export const issues = [
  issue(1, "Web release 2.4", "ist_sample_in_progress", {
    assigneeId: people.alex.id,
    priority: "high",
    updatedMinutesAgo: 30,
  }),
  issue(2, "Checkout test times out on CI", "ist_sample_in_progress", {
    assigneeId: people.alex.id,
    labelIds: ["lbl_sample_bug"],
    threadIds: [threads.checkoutTest.id],
    parentNumber: 1,
    priority: "high",
    updatedMinutesAgo: 2,
  }),
  issue(3, "Dark mode for settings", "ist_sample_in_review", {
    assigneeId: people.sam.id,
    assigneeIds: [people.sam.id, people.priya.id],
    labelIds: ["lbl_sample_feature"],
    threadIds: [threads.darkMode.id],
    pullIds: ["pr_sample_128"],
    parentNumber: 1,
    updatedMinutesAgo: 25,
  }),
  issue(4, "Pick a default page size for orders", "ist_sample_todo", {
    projectId: projects.api.id,
    assigneeId: people.alex.id,
    threadIds: [threads.paginate.id, threads.rateLimit.id],
    updatedMinutesAgo: 90,
  }),
  issue(5, "Search API rate limit", "ist_sample_in_progress", {
    projectId: projects.api.id,
    assigneeId: people.jordan.id,
    labelIds: ["lbl_sample_perf"],
    threadIds: [threads.rateLimit.id],
    updatedMinutesAgo: 5 * hour,
  }),
  issue(6, "Getting started guide", "ist_sample_todo", {
    projectId: projects.docs.id,
    assigneeId: people.priya.id,
    labelIds: ["lbl_sample_docs"],
    threadIds: [threads.gettingStarted.id],
    updatedMinutesAgo: 26 * hour,
  }),
  issue(7, "Move images to the CDN", "ist_sample_backlog", {
    labelIds: ["lbl_sample_perf"],
    priority: "low",
    updatedMinutesAgo: 8 * day,
  }),
  issue(8, "Bundler upgrade", "ist_sample_done", {
    assigneeId: people.casey.id,
    threadIds: [threads.bundler.id],
    pullIds: ["pr_sample_119"],
    updatedMinutesAgo: 9 * day,
  }),
  issue(9, "Retire the legacy site", "ist_sample_canceled", {
    projectId: projects.old.id,
    updatedMinutesAgo: 30 * day,
  }),
  issue(10, "Search: empty state", "ist_sample_todo", {
    projectId: projects.docs.id,
    parentNumber: 6,
    updatedMinutesAgo: 3 * hour,
  }),
  issue(11, "Search: shortcut hints", "ist_sample_todo", {
    projectId: projects.docs.id,
    parentNumber: 6,
    updatedMinutesAgo: 4 * hour,
  }),
  issue(12, "Rate limit: 429 body", "ist_sample_in_progress", {
    projectId: projects.api.id,
    parentNumber: 5,
    updatedMinutesAgo: 2 * hour,
  }),
  issue(13, "Settings: contrast pass", "ist_sample_in_review", {
    assigneeId: people.sam.id,
    parentNumber: 3,
    updatedMinutesAgo: 40,
  }),
  issue(14, "Rate limit: retry budget", "ist_sample_todo", {
    projectId: projects.api.id,
    pullIds: ["pr_sample_119", "pr_sample_128"],
    updatedMinutesAgo: 90,
  }),
  issue(20, "Release: changelog entry", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 80,
  }),
  issue(21, "Release: bump the version", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 81,
  }),
  issue(22, "Release: tag the build", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 82,
  }),
  issue(23, "Release: verify the rollback", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 83,
  }),
  issue(24, "Release: update the deploy notes", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 84,
  }),
  issue(25, "Release: screenshot the release", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 85,
  }),
  issue(26, "Release: archive the old assets", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 86,
  }),
  issue(27, "Release: draft the announcement", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 87,
  }),
  issue(28, "Release: localise the copy", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 88,
  }),
  issue(29, "Release: audit the bundle", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 1,
    updatedMinutesAgo: 89,
  }),
  issue(30, "Retry the gateway call", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 90,
  }),
  issue(31, "Raise the sandbox timeout", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 91,
  }),
  issue(32, "Capture the failing trace", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 92,
  }),
  issue(33, "Split the payment fixture", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 93,
  }),
  issue(34, "Log the retry count", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 94,
  }),
  issue(35, "Assert the retry budget", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 95,
  }),
  issue(36, "Shard the payment suite", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 96,
  }),
  issue(37, "Record the p95 latency", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 97,
  }),
  issue(38, "Drop the flaky sleep", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 98,
  }),
  issue(39, "Pin the sandbox image", "ist_sample_done", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 99,
  }),
  issue(40, "Trace the slow fixture", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 100,
  }),
  issue(41, "Compare the local run", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 101,
  }),
  issue(42, "Measure the parallel load", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 102,
  }),
  issue(43, "Document the timeout", "ist_sample_todo", {
    projectId: projects.web.id,
    parentNumber: 2,
    updatedMinutesAgo: 103,
  }),
];

export type PullState = "draft" | "ready" | "merged" | "closed";

/**
 * The pull the parity captures open at `/pull/keyurbodar/xin/118`. Its detail
 * rows live in `pulls/fixtures.ts`; this row only carries what the list and the
 * by-number lookup need.
 */
export const xinPull = {
  id: "pr_sample_118",
  repo: "keyurbodar/xin",
  number: 118,
  title: "Charge retries against a time budget",
  state: "ready" as PullState,
  authorId: people.sam.id,
  headRef: "refactor/retry-budget",
  baseRef: "main",
  additions: 80,
  deletions: 24,
  threadId: null,
  updatedAt: isoMinutesAgo(35),
} as const;

export const pulls = [
  {
    id: "pr_sample_128",
    repo: "acme/web",
    number: 128,
    title: "Add dark mode to settings",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/dark-mode",
    baseRef: "main",
    additions: 42,
    deletions: 7,
    threadId: threads.darkMode.id,
    updatedAt: isoMinutesAgo(25),
  },
  {
    id: "pr_sample_131",
    repo: "acme/web",
    number: 131,
    title: "Retry checkout on gateway timeouts",
    state: "draft" as PullState,
    authorId: people.alex.id,
    headRef: "fix/checkout-timeout",
    baseRef: "main",
    additions: 18,
    deletions: 3,
    threadId: threads.checkoutTest.id,
    updatedAt: isoMinutesAgo(4),
  },
  {
    id: "pr_sample_119",
    repo: "acme/web",
    number: 119,
    title: "Upgrade the bundler",
    state: "merged" as PullState,
    authorId: people.casey.id,
    headRef: "chore/bundler-upgrade",
    baseRef: "main",
    additions: 310,
    deletions: 268,
    threadId: threads.bundler.id,
    updatedAt: isoMinutesAgo(9 * day),
  },
  {
    id: "pr_sample_57",
    repo: "acme/api",
    number: 57,
    title: "Cursor pagination for orders",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/orders-cursor",
    baseRef: "main",
    additions: 96,
    deletions: 12,
    threadId: threads.paginate.id,
    updatedAt: isoMinutesAgo(80),
  },
  {
    id: "pr_sample_12",
    repo: "acme/docs",
    number: 12,
    title: "Draft quickstart",
    state: "closed" as PullState,
    authorId: people.priya.id,
    headRef: "docs/quickstart",
    baseRef: "main",
    additions: 120,
    deletions: 0,
    threadId: null,
    updatedAt: isoMinutesAgo(12 * day),
  },
  xinPull,
  {
    id: "pr_sample_312",
    repo: "acme/web",
    number: 312,
    title: "Shard the release test suite",
    state: "ready" as PullState,
    authorId: people.alex.id,
    headRef: "feat/shard-suite",
    baseRef: "main",
    additions: 186,
    deletions: 64,
    threadId: threads.captureFiles.id,
    updatedAt: isoMinutesAgo(44),
  },
  {
    id: "pr_sample_313",
    repo: "acme/web",
    number: 313,
    title: "Retry a shard twice before failing the release",
    state: "draft" as PullState,
    authorId: people.alex.id,
    headRef: "fix/shard-retry",
    baseRef: "main",
    additions: 34,
    deletions: 19,
    threadId: threads.capturePipeline.id,
    updatedAt: isoMinutesAgo(4),
  },
  {
    id: "pr_sample_330",
    repo: "acme/web",
    number: 330,
    title: "Queue depth per worker on the usage chart",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/queue-depth",
    baseRef: "main",
    additions: 214,
    deletions: 88,
    threadId: threads.listQueueDepth.id,
    updatedAt: isoMinutesAgo(6),
  },
  {
    id: "pr_sample_331",
    repo: "acme/web",
    number: 331,
    title: "Empty state copy for the orders table",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "fix/empty-state",
    baseRef: "main",
    additions: 42,
    deletions: 6,
    threadId: threads.listEmptyState.id,
    updatedAt: isoMinutesAgo(53),
  },
  {
    id: "pr_sample_332",
    repo: "acme/web",
    number: 332,
    title: "Webhook delivery log with retries",
    state: "failed" as PullState,
    authorId: people.sam.id,
    headRef: "feat/webhooks",
    baseRef: "main",
    additions: 968,
    deletions: 41,
    threadId: threads.listWebhooks.id,
    updatedAt: isoMinutesAgo(100),
  },
  {
    id: "pr_sample_333",
    repo: "acme/web",
    number: 333,
    title: "Rate limit the search endpoint per token",
    state: "pending" as PullState,
    authorId: people.sam.id,
    headRef: "fix/rate-limit",
    baseRef: "main",
    additions: 76,
    deletions: 12,
    threadId: threads.listRateLimit.id,
    updatedAt: isoMinutesAgo(147),
  },
  {
    id: "pr_sample_334",
    repo: "acme/web",
    number: 334,
    title: "CSV export of the ledger, streamed",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/exports",
    baseRef: "main",
    additions: 305,
    deletions: 74,
    threadId: threads.listExports.id,
    updatedAt: isoMinutesAgo(194),
  },
  {
    id: "pr_sample_335",
    repo: "acme/web",
    number: 335,
    title: "Store the due date in the org timezone",
    state: "failed" as PullState,
    authorId: people.sam.id,
    headRef: "fix/timezone",
    baseRef: "main",
    additions: 51,
    deletions: 9,
    threadId: threads.listTimezone.id,
    updatedAt: isoMinutesAgo(241),
  },
  {
    id: "pr_sample_336",
    repo: "acme/web",
    number: 336,
    title: "Audit log rows for label changes",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/audit",
    baseRef: "main",
    additions: 143,
    deletions: 22,
    threadId: threads.listAudit.id,
    updatedAt: isoMinutesAgo(288),
  },
  {
    id: "pr_sample_337",
    repo: "acme/web",
    number: 337,
    title: "Cursor pagination for the drive listing",
    state: "pending" as PullState,
    authorId: people.sam.id,
    headRef: "fix/pagination",
    baseRef: "main",
    additions: 87,
    deletions: 18,
    threadId: threads.listDrivePaging.id,
    updatedAt: isoMinutesAgo(35),
  },
  {
    id: "pr_sample_338",
    repo: "acme/web",
    number: 338,
    title: "Keyboard shortcuts for the issues list",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/shortcuts",
    baseRef: "main",
    additions: 132,
    deletions: 27,
    threadId: threads.listShortcuts.id,
    updatedAt: isoMinutesAgo(82),
  },
  {
    id: "pr_sample_339",
    repo: "acme/web",
    number: 339,
    title: "Weekly digest email, rendered from the org",
    state: "failed" as PullState,
    authorId: people.sam.id,
    headRef: "feat/digest",
    baseRef: "main",
    additions: 261,
    deletions: 33,
    threadId: threads.listDigest.id,
    updatedAt: isoMinutesAgo(129),
  },
  {
    id: "pr_sample_340",
    repo: "acme/web",
    number: 340,
    title: "Preview tunnel retries after a dropped socket",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "fix/preview",
    baseRef: "main",
    additions: 58,
    deletions: 11,
    threadId: threads.listPreviewRetry.id,
    updatedAt: isoMinutesAgo(176),
  },
  {
    id: "pr_sample_341",
    repo: "acme/web",
    number: 341,
    title: "Per-org concurrency limits on machines",
    state: "ready" as PullState,
    authorId: people.sam.id,
    headRef: "feat/limits",
    baseRef: "main",
    additions: 190,
    deletions: 46,
    threadId: threads.listLimits.id,
    updatedAt: isoMinutesAgo(223),
  },
  {
    id: "pr_sample_342",
    repo: "acme/web",
    number: 342,
    title: "Bump the runtime image to the new base",
    state: "merged" as PullState,
    authorId: people.sam.id,
    headRef: "chore/runtime-bump",
    baseRef: "main",
    additions: 24,
    deletions: 24,
    threadId: threads.listRuntimeBump.id,
    updatedAt: isoMinutesAgo(270),
  },
  {
    id: "pr_sample_343",
    repo: "acme/web",
    number: 343,
    title: "Drop the unused schema columns",
    state: "merged" as PullState,
    authorId: people.sam.id,
    headRef: "chore/schema-audit",
    baseRef: "main",
    additions: 19,
    deletions: 240,
    threadId: threads.listSchemaAudit.id,
    updatedAt: isoMinutesAgo(17),
  },
  {
    id: "pr_sample_344",
    repo: "acme/web",
    number: 344,
    title: "Draft: unified search across drive and issues",
    state: "draft" as PullState,
    authorId: people.sam.id,
    headRef: "feat/draft-search",
    baseRef: "main",
    additions: 72,
    deletions: 8,
    threadId: threads.listDraftSearch.id,
    updatedAt: isoMinutesAgo(64),
  },
  {
    id: "pr_sample_345",
    repo: "acme/web",
    number: 345,
    title: "Remove the legacy webhook queue",
    state: "closed" as PullState,
    authorId: people.sam.id,
    headRef: "chore/drop-legacy",
    baseRef: "main",
    additions: 8,
    deletions: 412,
    threadId: threads.listDropLegacy.id,
    updatedAt: isoMinutesAgo(111),
  },
  {
    id: "pr_sample_346",
    repo: "acme/web",
    number: 346,
    title: "Memoise the pricing lookups",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/memo-cache",
    baseRef: "main",
    additions: 64,
    deletions: 9,
    threadId: threads.listMemo.id,
    updatedAt: isoMinutesAgo(8),
  },
  {
    id: "pr_sample_347",
    repo: "acme/web",
    number: 347,
    title: "Invite links carry the project scope",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/invites",
    baseRef: "main",
    additions: 118,
    deletions: 20,
    threadId: threads.listInvites.id,
    updatedAt: isoMinutesAgo(69),
  },
  {
    id: "pr_sample_348",
    repo: "acme/web",
    number: 348,
    title: "Stop the theme flash on first paint",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "fix/theme-flash",
    baseRef: "main",
    additions: 23,
    deletions: 4,
    threadId: threads.listTheme.id,
    updatedAt: isoMinutesAgo(130),
  },
  {
    id: "pr_sample_349",
    repo: "acme/web",
    number: 349,
    title: "Cap the upload size before the request",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "fix/upload-size",
    baseRef: "main",
    additions: 47,
    deletions: 13,
    threadId: threads.listUpload.id,
    updatedAt: isoMinutesAgo(191),
  },
  {
    id: "pr_sample_350",
    repo: "acme/web",
    number: 350,
    title: "SAML metadata refresh every six hours",
    state: "failed" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/saml",
    baseRef: "main",
    additions: 340,
    deletions: 52,
    threadId: threads.listSaml.id,
    updatedAt: isoMinutesAgo(252),
  },
  {
    id: "pr_sample_351",
    repo: "acme/web",
    number: 351,
    title: "Rank search results by recency",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/search-rank",
    baseRef: "main",
    additions: 88,
    deletions: 31,
    threadId: threads.listSearch.id,
    updatedAt: isoMinutesAgo(313),
  },
  {
    id: "pr_sample_352",
    repo: "acme/web",
    number: 352,
    title: "Run cron schedules in the org timezone",
    state: "ready" as PullState,
    authorId: people.jordan.id,
    headRef: "fix/cron-zone",
    baseRef: "main",
    additions: 29,
    deletions: 7,
    threadId: threads.listCron.id,
    updatedAt: isoMinutesAgo(374),
  },
  {
    id: "pr_sample_353",
    repo: "acme/web",
    number: 353,
    title: "Usage rows carry the billing period",
    state: "pending" as PullState,
    authorId: people.jordan.id,
    headRef: "feat/billing-usage",
    baseRef: "main",
    additions: 196,
    deletions: 44,
    threadId: threads.listBilling.id,
    updatedAt: isoMinutesAgo(35),
  },
] as const;

export const machines = [
  {
    id: "machine_sample_cloud1",
    kind: "cloud",
    name: "Cloud machine",
    size: "large",
    status: "running",
    threadId: threads.checkoutTest.id,
    createdAt: isoMinutesAgo(3 * hour),
  },
  {
    id: "machine_sample_cloud2",
    kind: "cloud",
    name: "Cloud machine",
    size: "medium",
    status: "sleeping",
    threadId: threads.darkMode.id,
    createdAt: isoMinutesAgo(day),
  },
  {
    id: "machine_sample_cloud3",
    kind: "cloud",
    name: "Cloud machine",
    size: "large",
    status: "stopped",
    threadId: threads.bundler.id,
    createdAt: isoMinutesAgo(10 * day),
  },
  {
    id: "machine_sample_cloud4",
    kind: "cloud",
    name: "Cloud machine",
    size: "large",
    status: "running",
    threadId: threads.capturePipeline.id,
    createdAt: isoMinutesAgo(3 * hour),
  },
  {
    id: "machine_sample_cloud5",
    kind: "cloud",
    name: "Cloud machine",
    size: "medium",
    status: "running",
    threadId: threads.captureFiles.id,
    createdAt: isoMinutesAgo(2 * hour),
  },
  {
    id: "machine_sample_cloud6",
    kind: "cloud",
    name: "Cloud machine",
    size: "large",
    status: "sleeping",
    threadId: threads.captureSideParent.id,
    createdAt: isoMinutesAgo(4 * hour),
  },
  {
    id: "machine_sample_cloud7",
    kind: "cloud",
    name: "Cloud machine",
    size: "small",
    status: "sleeping",
    threadId: threads.captureProbe.id,
    createdAt: isoMinutesAgo(6 * hour),
  },
] as const;

export const devices = [
  {
    id: "machine_sample_laptop",
    kind: "device",
    name: "alex-laptop",
    os: "macos",
    arch: "arm64",
    cores: 10,
    memoryGb: 32,
    ownerId: people.alex.id,
    online: true,
    lastSeenAt: isoMinutesAgo(1),
    sharedWithOrg: false,
  },
  {
    id: "machine_sample_buildbox",
    kind: "device",
    name: "build-box",
    os: "linux",
    arch: "x86_64",
    cores: 16,
    memoryGb: 64,
    ownerId: people.sam.id,
    online: true,
    lastSeenAt: isoMinutesAgo(3),
    sharedWithOrg: true,
  },
  {
    id: "machine_sample_desktop",
    kind: "device",
    name: "jordan-desktop",
    os: "windows",
    arch: "x86_64",
    cores: 8,
    memoryGb: 16,
    ownerId: people.jordan.id,
    online: false,
    lastSeenAt: isoMinutesAgo(2 * day),
    sharedWithOrg: false,
  },
] as const;

export const automations = [
  {
    id: "auto_sample_deps",
    name: "Nightly dependency check",
    projectId: projects.web.id,
    enabled: true,
    trigger: { kind: "schedule", cron: "0 2 * * *", timezone: "UTC" },
    ownerId: people.sam.id,
    lastRunAt: isoMinutesAgo(7 * hour),
  },
  {
    id: "auto_sample_changelog",
    name: "Weekly changelog",
    projectId: projects.docs.id,
    enabled: true,
    trigger: { kind: "schedule", cron: "0 9 * * 1", timezone: "UTC" },
    ownerId: people.priya.id,
    lastRunAt: isoMinutesAgo(day),
  },
  {
    id: "auto_sample_pr_followup",
    name: "Follow up on merged PRs",
    projectId: projects.api.id,
    enabled: false,
    trigger: { kind: "event", event: "pull_request_merged" },
    ownerId: people.alex.id,
    lastRunAt: null,
  },
  {
    id: "auto_sample_status_digest",
    name: "App status digest",
    projectId: projects.web.id,
    enabled: true,
    trigger: {
      kind: "schedule",
      cron: "*/30 * * * *",
      timezone: "Asia/Calcutta",
    },
    ownerId: people.alex.id,
    lastRunAt: isoMinutesAgo(20),
  },
  {
    id: "auto_sample_build_janitor",
    name: "Build janitor",
    projectId: projects.web.id,
    enabled: true,
    trigger: { kind: "schedule", cron: "0 * * * *", timezone: "UTC" },
    ownerId: people.alex.id,
    lastRunAt: isoMinutesAgo(20),
  },
  {
    id: "auto_sample_flake_watch",
    name: "Flake watch on new pushes",
    projectId: projects.api.id,
    enabled: true,
    trigger: { kind: "event", event: "pull_request_pushed" },
    ownerId: people.alex.id,
    lastRunAt: isoMinutesAgo(2 * hour),
  },
  {
    id: "auto_sample_release_notes",
    name: "Draft release notes",
    projectId: projects.docs.id,
    enabled: false,
    trigger: { kind: "schedule", cron: "0 * * * *", timezone: "UTC" },
    ownerId: people.alex.id,
    lastRunAt: isoMinutesAgo(3 * day),
  },
] as const;

export const threadFolders = [
  {
    id: "fld_sample_release",
    name: "Release",
    position: 0,
    visibility: "shared",
    section: "threads",
    ownerUserId: people.alex.id,
    hidden: false,
    memberIds: [people.sam.id, people.priya.id] as ReadonlyArray<string>,
    createdAt: isoMinutesAgo(14 * day),
    updatedAt: isoMinutesAgo(2 * day),
  },
  {
    id: "fld_sample_research",
    name: "Research",
    position: 1,
    visibility: "private",
    section: "threads",
    ownerUserId: people.alex.id,
    hidden: false,
    memberIds: [] as ReadonlyArray<string>,
    createdAt: isoMinutesAgo(6 * day),
    updatedAt: isoMinutesAgo(6 * day),
  },
] as const;

export const threadFolderItems = [
  {
    folderId: "fld_sample_release",
    jamId: threads.checkoutTest.id,
    position: 0,
  },
  { folderId: "fld_sample_release", jamId: threads.darkMode.id, position: 1 },
  { folderId: "fld_sample_release", jamId: threads.bundler.id, position: 2 },
  { folderId: "fld_sample_research", jamId: threads.incidents.id, position: 0 },
] as const;

export const threadTags = [
  {
    id: "tag_sample_frontend",
    name: "frontend",
    color: "primary",
    deleted: false,
    createdAt: isoMinutesAgo(30 * day),
  },
  {
    id: "tag_sample_backend",
    name: "backend",
    color: "blue",
    deleted: false,
    createdAt: isoMinutesAgo(30 * day),
  },
  {
    id: "tag_sample_urgent",
    name: "urgent",
    color: "destructive",
    deleted: false,
    createdAt: isoMinutesAgo(20 * day),
  },
] as const;

export const threadTagAssignments = [
  { jamId: threads.checkoutTest.id, tagId: "tag_sample_frontend" },
  { jamId: threads.checkoutTest.id, tagId: "tag_sample_urgent" },
  { jamId: threads.darkMode.id, tagId: "tag_sample_frontend" },
  { jamId: threads.paginate.id, tagId: "tag_sample_backend" },
] as const;

export const threadPins = [
  { jamId: threads.paginate.id },
  { jamId: threads.checkoutTest.id },
] as const;

export interface McpServerRow {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly url: string;
  readonly transport: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Null until the server has actually been tested. */
  readonly lastCheckedAt: string | null;
}

export const mcpServers: ReadonlyArray<McpServerRow> = [
  {
    id: "mcp_sample_errors",
    key: "errors",
    name: "Error tracker",
    url: "https://mcp.example.com/errors",
    transport: "http",
    status: "connected",
    createdAt: isoMinutesAgo(6 * day),
    updatedAt: isoMinutesAgo(52),
    lastCheckedAt: isoMinutesAgo(52),
  },
  {
    id: "mcp_sample_docs",
    key: "docs",
    name: "Docs search",
    url: "https://mcp.example.com/docs",
    transport: "http",
    status: "needs_auth",
    createdAt: isoMinutesAgo(3 * day),
    updatedAt: isoMinutesAgo(60),
    lastCheckedAt: isoMinutesAgo(60),
  },
  {
    id: "mcp_sample_untested",
    key: "untested",
    name: "Untested server",
    url: "https://mcp.example.com/untested",
    transport: "http",
    status: "connected",
    createdAt: isoMinutesAgo(30),
    updatedAt: isoMinutesAgo(30),
    lastCheckedAt: null,
  },
];

export const apiKeys = [
  {
    id: "key_sample_ci",
    name: "CI",
    prefix: "capy_sk_ab12",
    createdBy: people.sam.id,
    createdAt: isoMinutesAgo(40 * day),
    lastUsedAt: isoMinutesAgo(hour),
    revokedAt: null,
  },
  {
    id: "key_sample_old",
    name: "Old script",
    prefix: "capy_sk_9f3e",
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(80 * day),
    lastUsedAt: isoMinutesAgo(50 * day),
    revokedAt: isoMinutesAgo(45 * day),
  },
] as const;

/** Capy's preset theme ids (parity map, scope decision 6). Custom themes are invented here. */
export const presetThemeIds = [
  "absolutely",
  "bearded-oled",
  "catppuccin",
  "codex",
  "crimson-evernight",
  "everforest",
  "firecrawl",
  "github",
  "gruvbox",
  "hub",
  "linear",
  "notion",
  "one",
] as const;

export const models = [
  {
    id: "anthropic/claude-opus",
    label: "Claude Opus",
    provider: "anthropic",
    tier: "peak",
  },
  {
    id: "anthropic/claude-sonnet",
    label: "Claude Sonnet",
    provider: "anthropic",
    tier: "excellent",
  },
  { id: "openai/gpt", label: "GPT", provider: "openai", tier: "peak" },
  {
    id: "google/gemini",
    label: "Gemini",
    provider: "google",
    tier: "excellent",
  },
] as const;

export const driveFiles = [
  {
    id: "file_sample_spec",
    path: "specs/checkout-retry.md",
    size: 4_812,
    mimeType: "text/markdown",
    updatedAt: isoMinutesAgo(3 * hour),
    updatedBy: people.alex.id,
  },
  {
    id: "file_sample_chart",
    path: "reports/latency-week-9.png",
    size: 182_340,
    mimeType: "image/png",
    updatedAt: isoMinutesAgo(day),
    updatedBy: people.jordan.id,
  },
  {
    id: "file_sample_notes",
    path: "notes/release-2.4.md",
    size: 1_204,
    mimeType: "text/markdown",
    updatedAt: isoMinutesAgo(30),
    updatedBy: people.sam.id,
  },
] as const;

/** Stable ids per collection so groups can cross-reference without importing each other. */
/** Invitations the viewer received from other organizations. */
export const myInvitations = [
  {
    id: "inv_sample_globex",
    orgId: "org_sample_globex",
    orgName: "Globex",
    orgAvatarUrl: null as string | null,
    inviterName: "Robin Park",
    projectCount: 3,
    invitedAt: isoMinutesAgo(day),
  },
  {
    id: "inv_sample_initech",
    orgId: "org_sample_initech",
    orgName: "Initech",
    orgAvatarUrl: null as string | null,
    inviterName: "Dana Kim",
    projectCount: 0,
    invitedAt: isoMinutesAgo(3 * day),
  },
];

/** Organizations the viewer can join through their verified email domain. */
export const joinableOrganizations = [
  {
    orgId: "org_sample_umbrella",
    orgName: "Umbrella Studio",
    orgAvatarUrl: null as string | null,
    projectCount: 1,
  },
];

export const world = {
  org,
  people,
  members,
  pendingInvitations,
  serviceUsers,
  projects,
  repos,
  branches,
  threads,
  captains,
  issueStates,
  issueLabels,
  issues,
  pulls,
  machines,
  devices,
  automations,
  threadFolders,
  threadFolderItems,
  threadTags,
  threadTagAssignments,
  threadPins,
  mcpServers,
  apiKeys,
  presetThemeIds,
  models,
  driveFiles,
  myInvitations,
  joinableOrganizations,
} as const;
