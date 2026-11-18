import { DateTime } from "effect";
import {
  JamId,
  ProjectId,
  PullRequestId,
  UserId,
} from "../../api/schemas/ids.ts";
import {
  PullRequestChip,
  ThreadCard,
  type ThreadStatus,
} from "../../api/schemas/thread.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, threads, world } from "../fixtures/world.ts";

const owner = UserId.make(world.people.alex.id);

const thread = (options: {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly status: ThreadStatus;
  readonly projectId: string | null;
  readonly activeMinutesAgo: number;
  readonly preview?: string;
  readonly pinned?: boolean;
  readonly unread?: boolean;
  readonly modelId?: string;
  readonly machine?: { readonly kind: "cloud"; readonly size: string };
  readonly pull?: { readonly number: number; readonly title: string };
}) => {
  const activity = minutesAgo(options.activeMinutesAgo);
  return new ThreadCard({
    id: JamId.make(options.id),
    primaryMachine: options.machine,
    title: options.title,
    titleCustom: false,
    status: options.status,
    archived: options.status === "archived",
    archivedIdleDays: null,
    threadNumber: options.number,
    userId: owner,
    userType: "human",
    takenFromUserId: null,
    takenFromUserType: null,
    origin: "web",
    projectId:
      options.projectId === null ? null : ProjectId.make(options.projectId),
    slackChannel: null,
    linearIssue: null,
    pinned: options.pinned ?? false,
    settledAt: undefined,
    section: undefined,
    member: true,
    subscribed: true,
    personal: false,
    tagIds: [],
    importing: false,
    lastModelId: options.modelId ?? null,
    pulls: options.pull
      ? [
          new PullRequestChip({
            id: PullRequestId.make(`pr_sample_${options.pull.number}`),
            repo: "acme/web",
            number: options.pull.number,
            title: options.pull.title,
            state: "ready",
            additions: 42,
            deletions: 7,
            diffBreakdown: null,
            author: "alex-sample",
            authorAvatarUrl: "",
            url: `https://github.com/acme/web/pull/${options.pull.number}`,
          }),
        ]
      : [],
    createdAt: DateTime.subtract(activity, { hours: 2 }),
    updatedAt: activity,
    lastActivityAt: activity,
    preview: options.preview ?? null,
    sortActivityAt: activity,
    hasUnreads: options.unread ?? false,
    mentionCount: 0,
    owed: false,
    needsYou: false,
    ask: null,
    crewNeedsYou: 0,
    participated: true,
    crewMentionCount: 0,
    needsYouEventId: null,
    captain: undefined,
    crewCount: undefined,
    automation: undefined,
  });
};

export const sampleThreads = [
  thread({
    id: threads.checkoutTest.id,
    number: threads.checkoutTest.number,
    title: threads.checkoutTest.title,
    status: "working",
    projectId: threads.checkoutTest.projectId,
    activeMinutesAgo: 2,
    preview: "Reproducing the timeout locally before changing the retry.",
    unread: true,
  }),
  thread({
    id: threads.darkMode.id,
    number: threads.darkMode.number,
    title: threads.darkMode.title,
    status: "waiting",
    projectId: threads.darkMode.projectId,
    activeMinutesAgo: 25,
    pull: { number: 128, title: "Add dark mode to settings" },
  }),
  thread({
    id: threads.paginate.id,
    number: threads.paginate.number,
    title: threads.paginate.title,
    status: "idle",
    projectId: threads.paginate.projectId,
    activeMinutesAgo: 90,
    pinned: true,
  }),
  thread({
    id: threads.rateLimit.id,
    number: threads.rateLimit.number,
    title: threads.rateLimit.title,
    status: "failed",
    projectId: threads.rateLimit.projectId,
    activeMinutesAgo: 60 * 5,
  }),
  thread({
    id: threads.gettingStarted.id,
    number: threads.gettingStarted.number,
    title: threads.gettingStarted.title,
    status: "idle",
    projectId: threads.gettingStarted.projectId,
    activeMinutesAgo: 60 * 26,
  }),
  thread({
    id: threads.incidents.id,
    number: threads.incidents.number,
    title: threads.incidents.title,
    status: "idle",
    projectId: threads.incidents.projectId,
    activeMinutesAgo: 60 * 50,
  }),
  thread({
    id: threads.bundler.id,
    number: threads.bundler.number,
    title: threads.bundler.title,
    status: "archived",
    projectId: threads.bundler.projectId,
    activeMinutesAgo: 60 * 24 * 9,
  }),
  thread({
    id: threads.capturePipeline.id,
    number: threads.capturePipeline.number,
    title: threads.capturePipeline.title,
    status: "working",
    projectId: threads.capturePipeline.projectId,
    activeMinutesAgo: 3,
    preview: "Running the last shard again before I push the retry budget.",
    unread: true,
    modelId: world.models[1].id,
    machine: { kind: "cloud", size: "large" },
  }),
  thread({
    id: threads.captureFiles.id,
    number: threads.captureFiles.number,
    title: threads.captureFiles.title,
    status: "idle",
    projectId: threads.captureFiles.projectId,
    activeMinutesAgo: 44,
    preview: "Shards 1 to 6 pass with the split at 40 tests each.",
    modelId: world.models[1].id,
    machine: { kind: "cloud", size: "medium" },
    pull: { number: 312, title: "Shard the release test suite" },
  }),
  thread({
    id: threads.captureSideParent.id,
    number: threads.captureSideParent.number,
    title: threads.captureSideParent.title,
    status: "waiting",
    projectId: threads.captureSideParent.projectId,
    activeMinutesAgo: 72,
    modelId: world.models[0].id,
    machine: { kind: "cloud", size: "large" },
  }),
  thread({
    id: threads.captureProbe.id,
    number: threads.captureProbe.number,
    title: threads.captureProbe.title,
    status: "idle",
    projectId: threads.captureProbe.projectId,
    activeMinutesAgo: 60 * 5 + 20,
    modelId: world.models[1].id,
    machine: { kind: "cloud", size: "small" },
  }),
];

export interface ThreadAccess {
  readonly jamId: string;
  readonly policy: "everyone" | "invite" | "org";
  readonly memberIds: ReadonlyArray<string>;
  readonly ownerId: string;
  readonly joinPolicy: "anyone" | "members" | "invite";
  readonly compactAt: string | null;
  readonly unread: boolean;
  readonly settled: boolean;
  readonly subscribed: boolean;
  readonly slack: {
    readonly linked: boolean;
    readonly active: boolean;
    readonly channelId: string;
    readonly channelName: string;
  } | null;
  readonly connection: {
    readonly provider: string;
    readonly modelId: string;
    readonly status: "connected" | "needs_auth";
    readonly retryCount: number;
  };
  readonly environment: Readonly<Record<string, string>>;
  readonly asks: ReadonlyArray<{
    readonly id: string;
    readonly jamId: string;
    readonly userId: string;
    readonly state: "open" | "dismissed";
    readonly prompt: string;
    readonly createdAt: string;
  }>;
}

export const accessTemplate = (jamId: string): ThreadAccess => ({
  jamId,
  policy: "invite",
  memberIds: [world.people.alex.id, world.people.sam.id],
  ownerId: world.people.alex.id,
  joinPolicy: "members",
  compactAt: null,
  unread: false,
  settled: false,
  subscribed: true,
  slack: null,
  connection: {
    provider: "openai",
    modelId: world.models[2].id,
    status: "connected",
    retryCount: 0,
  },
  environment: {
    API_BASE_URL: "https://api.example.com",
    LOG_LEVEL: "info",
  },
  asks: [
    {
      id: `ask_${jamId}_1`,
      jamId,
      userId: world.people.alex.id,
      state: "open",
      prompt: "Should the retry wait for an explicit approval?",
      createdAt: isoMinutesAgo(20),
    },
    {
      id: `ask_${jamId}_2`,
      jamId,
      userId: world.people.sam.id,
      state: "dismissed",
      prompt: "Can we reuse the sandbox credentials?",
      createdAt: isoMinutesAgo(90),
    },
  ],
});

export const sampleThreadAccess: ReadonlyArray<ThreadAccess> = [
  {
    ...accessTemplate(threads.checkoutTest.id),
    unread: true,
    slack: {
      linked: true,
      active: true,
      channelId: "C_SAMPLE_WEB",
      channelName: "web-releases",
    },
  },
  {
    ...accessTemplate(threads.darkMode.id),
    ownerId: world.people.sam.id,
    settled: true,
  },
  {
    ...accessTemplate(threads.paginate.id),
    compactAt: isoMinutesAgo(60 * 5),
  },
];

/**
 * Access records for Captain threads. A Captain is a thread: `jams.list` leaves
 * Captains to the Captain list so they are not listed twice, but `jams.get`
 * answers for one, because the thread route and its Setup pane open a Captain
 * by jam id and read its project through that detail.
 */
export const sampleCaptainAccess: ReadonlyArray<ThreadAccess> =
  world.captains.map((captain) => ({
    ...accessTemplate(captain.id),
    ownerId: captain.ownerId,
    memberIds: [...new Set([captain.ownerId, world.people.alex.id])],
  }));

export interface AccessRequest {
  readonly id: string;
  readonly jamId: string;
  readonly userId: string;
  readonly requesterId: string;
  readonly status: string;
  readonly createdAt: string;
}

export const sampleAccessRequests: ReadonlyArray<AccessRequest> = [
  {
    id: "req_sample_access_1",
    jamId: threads.checkoutTest.id,
    userId: world.people.priya.id,
    requesterId: world.people.priya.id,
    status: "pending",
    createdAt: isoMinutesAgo(12),
  },
  {
    id: "req_sample_access_2",
    jamId: threads.darkMode.id,
    userId: world.people.jordan.id,
    requesterId: world.people.jordan.id,
    status: "pending",
    createdAt: isoMinutesAgo(70),
  },
];

export interface ThreadCredits {
  readonly jamId: string;
  readonly amount: number;
  readonly currency: string;
  readonly state: string;
  readonly reason: string;
  readonly grantedBy: string;
  readonly grantedAt: string;
}

export const sampleCredits: ReadonlyArray<ThreadCredits> = [
  {
    jamId: threads.checkoutTest.id,
    amount: 2500,
    currency: "USD",
    state: "granted",
    reason: "Follow-up on a flaky test",
    grantedBy: world.people.sam.id,
    grantedAt: isoMinutesAgo(30),
  },
];

export const sampleConnectionUsage = [
  {
    provider: "openai",
    modelId: world.models[2].id,
    requests: 48,
    inputTokens: 124_000,
    outputTokens: 31_000,
    costUsd: 1.42,
    windowStart: isoMinutesAgo(60 * 24),
    windowEnd: isoMinutesAgo(0),
  },
];

export const sampleUsage = [
  {
    kind: "models",
    label: "Model usage",
    amount: 4.68,
    currency: "USD",
    unit: "usd",
    limit: 25,
    period: "current month",
  },
  {
    kind: "agents",
    label: "Agent runs",
    amount: 16,
    currency: null,
    unit: "runs",
    limit: 50,
    period: "current month",
  },
];

export interface ThreadUsageMember {
  readonly jamId: string;
  readonly familyId: string;
  readonly usage: { readonly totalCredits: number; readonly vmCredits: number };
  readonly keyCredits: number;
  readonly models: ReadonlyArray<{
    readonly entryId: string;
    readonly label: string;
    readonly unbilled: boolean;
    readonly credentialName: string | null;
    readonly credits: number;
    readonly tokenFeeCredits: number;
  }>;
  readonly images: ReadonlyArray<unknown>;
}

/** Per-thread credits, so the capture ids' headers carry a real cost chip. */
const usageMember = (
  jamId: string,
  totalCredits: number,
  vmCredits: number,
): ThreadUsageMember => ({
  jamId,
  familyId: jamId,
  usage: { totalCredits, vmCredits },
  keyCredits: 0,
  models: [
    {
      entryId: `${jamId}:models:1`,
      label: "Claude Sonnet",
      unbilled: false,
      credentialName: null,
      credits: totalCredits - vmCredits,
      tokenFeeCredits: totalCredits - vmCredits,
    },
  ],
  images: [],
});

export const sampleThreadUsage: Readonly<Record<string, ThreadUsageMember>> = {
  [threads.capturePipeline.id]: usageMember(
    threads.capturePipeline.id,
    3_240,
    900,
  ),
  [threads.captureFiles.id]: usageMember(threads.captureFiles.id, 1_180, 420),
  [threads.captureSideParent.id]: usageMember(
    threads.captureSideParent.id,
    2_060,
    380,
  ),
  [threads.captureProbe.id]: usageMember(threads.captureProbe.id, 470, 120),
};

export const sampleAd = {
  id: "ad_sample_checkout",
  jamId: threads.checkoutTest.id,
  headline: "Keep the release on track",
  body: "Review the checkout retry before the next release window.",
  cta: "Open thread",
  url: "https://example.com/acme/checkout",
  createdAt: isoMinutesAgo(60 * 6),
};

export const sampleFeedbackRequests = [
  {
    id: "fr_sample_1",
    jamId: threads.checkoutTest.id,
    toolCallId: "tool_sample_feedback_1",
    state: "pending",
    prompt: "Was the retry suggestion useful?",
    createdAt: isoMinutesAgo(35),
  },
  {
    id: "fr_sample_2",
    jamId: threads.darkMode.id,
    toolCallId: "tool_sample_feedback_2",
    state: "pending",
    prompt: "Does the settings page look right on mobile?",
    createdAt: isoMinutesAgo(80),
  },
];

export interface AdHocAsk {
  readonly id: string;
  readonly jamId: string;
  readonly userId: string;
  readonly state: "open" | "dismissed";
  readonly prompt: string;
  readonly createdAt: string;
}

export const sampleAdHocAsks: ReadonlyArray<AdHocAsk> = [
  {
    id: "ask_sample_org_1",
    jamId: threads.checkoutTest.id,
    userId: world.people.alex.id,
    state: "open",
    prompt: "Approve the production retry change?",
    createdAt: isoMinutesAgo(18),
  },
  {
    id: "ask_sample_org_2",
    jamId: threads.paginate.id,
    userId: world.people.jordan.id,
    state: "dismissed",
    prompt: "Should we cap the page size at one hundred?",
    createdAt: isoMinutesAgo(45),
  },
];

export const projectOf = (jamId: string) =>
  sampleThreads.find((candidate) => candidate.id === jamId)?.projectId ?? null;

export const threadIssuesOf = (jamId: string) =>
  world.issues.filter((issue) => issue.threadIds.includes(jamId));

export const threadPullsOf = (jamId: string) =>
  world.pulls.filter((pull) => pull.threadId === jamId);
