import { isoMinutesAgo, threads } from "../fixtures/world.ts";

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
