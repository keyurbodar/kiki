import { isoMinutesAgo, people, threads } from "../fixtures/world.ts";

export interface AutomationRun {
  readonly id: string;
  readonly automationId: string;
  readonly status: "succeeded" | "running" | "cancelled" | "failed";
  readonly trigger: string;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly threadId: string | null;
}

export interface AutomationBatch {
  readonly id: string;
  readonly automationId: string;
  readonly kind: string;
  readonly status:
    | "starting"
    | "collecting"
    | "ready"
    | "cancelled"
    | "flushed";
  readonly itemCount: number;
  readonly createdAt: string;
  readonly flushedAt: string | null;
}

export interface AutomationUsage {
  readonly totalRuns: number;
  readonly succeededRuns: number;
  readonly failedRuns: number;
  readonly tokensUsed: number;
}

export const runs: ReadonlyArray<AutomationRun> = [
  {
    id: "run_sample_deps_2",
    automationId: "auto_sample_deps",
    status: "succeeded",
    trigger: "schedule",
    startedAt: isoMinutesAgo(7 * 60),
    finishedAt: isoMinutesAgo(7 * 60 - 3),
    threadId: threads.checkoutTest.id,
  },
  {
    id: "run_sample_deps_1",
    automationId: "auto_sample_deps",
    status: "failed",
    trigger: "schedule",
    startedAt: isoMinutesAgo(31 * 60),
    finishedAt: isoMinutesAgo(31 * 60 - 2),
    threadId: null,
  },
  {
    id: "run_sample_changelog_1",
    automationId: "auto_sample_changelog",
    status: "succeeded",
    trigger: "schedule",
    startedAt: isoMinutesAgo(24 * 60),
    finishedAt: isoMinutesAgo(24 * 60 - 5),
    threadId: threads.gettingStarted.id,
  },
  {
    id: "run_sample_followup_1",
    automationId: "auto_sample_pr_followup",
    status: "cancelled",
    trigger: "pull_request.merged",
    startedAt: isoMinutesAgo(3 * 24 * 60),
    finishedAt: isoMinutesAgo(3 * 24 * 60 - 1),
    threadId: threads.darkMode.id,
  },
];

export const batches: ReadonlyArray<AutomationBatch> = [
  {
    id: "batch_sample_deps",
    automationId: "auto_sample_deps",
    kind: "incoming_webhook",
    status: "collecting",
    itemCount: 3,
    createdAt: isoMinutesAgo(8 * 60),
    flushedAt: null,
  },
  {
    id: "batch_sample_changelog",
    automationId: "auto_sample_changelog",
    kind: "schedule",
    status: "ready",
    itemCount: 12,
    createdAt: isoMinutesAgo(25 * 60),
    flushedAt: null,
  },
  {
    id: "batch_sample_followup",
    automationId: "auto_sample_pr_followup",
    kind: "event",
    status: "flushed",
    itemCount: 1,
    createdAt: isoMinutesAgo(2 * 24 * 60),
    flushedAt: isoMinutesAgo(2 * 24 * 60 - 4),
  },
];

export const usage: Readonly<Record<string, AutomationUsage>> = {
  auto_sample_deps: {
    totalRuns: 14,
    succeededRuns: 11,
    failedRuns: 3,
    tokensUsed: 184_000,
  },
  auto_sample_changelog: {
    totalRuns: 8,
    succeededRuns: 8,
    failedRuns: 0,
    tokensUsed: 92_400,
  },
  auto_sample_pr_followup: {
    totalRuns: 2,
    succeededRuns: 1,
    failedRuns: 0,
    tokensUsed: 18_200,
  },
};

export const defaultUsage: AutomationUsage = {
  totalRuns: 0,
  succeededRuns: 0,
  failedRuns: 0,
  tokensUsed: 0,
};

/**
 * The fields the automation editor reads but the shared `world.automations`
 * rows don't carry. Seeded for every sample automation so the editor opens
 * with real instructions rather than blanks.
 */
export interface AutomationDetails {
  readonly description: string | null;
  readonly prompt: string;
  readonly triggers: ReadonlyArray<Record<string, unknown>>;
  readonly threadMode: "new" | "single";
  readonly singleJamId: string | null;
  readonly runAsKind: "human" | "service";
  readonly runAsId: string;
  readonly slackImpersonation: boolean;
  readonly quietSlackPosts: boolean;
  readonly model: { readonly id: string; readonly reasoning: string } | null;
  readonly maxRunsPerDay: number | null;
  readonly machineSize: string | null;
  readonly organize: {
    readonly pin?: boolean;
    readonly folders?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
  } | null;
  readonly creator: string;
  readonly creatorUserId: string;
  readonly updatedAt: string;
}

const detail = (
  prompt: string,
  options: {
    readonly description?: string;
    readonly schedule?: { readonly cron: string; readonly timezone: string };
    readonly event?: string;
    readonly enabledFor?: string;
  } = {},
): AutomationDetails => ({
  description: options.description ?? null,
  prompt,
  triggers:
    options.schedule !== undefined
      ? [{ type: "schedule", ...options.schedule }]
      : [{ type: "github", event: options.event ?? "pull_request.opened" }],
  threadMode: "new",
  singleJamId: null,
  runAsKind: "human",
  runAsId: people.sam.id,
  slackImpersonation: false,
  quietSlackPosts: false,
  model: null,
  maxRunsPerDay: null,
  machineSize: null,
  organize: null,
  creator: "Sam Rivera",
  creatorUserId: people.sam.id,
  updatedAt: isoMinutesAgo(options.enabledFor ? 7 * 60 : 60 * 24),
});

export const automationDetails: Readonly<Record<string, AutomationDetails>> = {
  auto_sample_deps: detail(
    "Check the web app's dependencies for advisories, open a thread per finding and link the pull request that fixes it.",
    {
      description: "Runs nightly against acme/web.",
      schedule: { cron: "0 2 * * *", timezone: "UTC" },
    },
  ),
  auto_sample_changelog: detail(
    "Collect the merged pull requests since the last release and write the changelog entry in the docs project.",
    {
      description: "Every Monday morning.",
      schedule: { cron: "0 9 * * 1", timezone: "UTC" },
    },
  ),
  auto_sample_pr_followup: detail(
    "When a pull request merges, comment the release checklist on the linked issue and tag its assignee.",
    {
      description: "Paused while the release stabilises.",
      event: "pull_request.merged",
    },
  ),
};
