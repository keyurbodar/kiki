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

const owner = UserId.make("user_sample_alex");

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
  readonly pull?: { readonly number: number; readonly title: string };
}) => {
  const activity = minutesAgo(options.activeMinutesAgo);
  return new ThreadCard({
    id: JamId.make(options.id),
    primaryMachine: undefined,
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
    lastModelId: null,
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
    id: "jam_sample_0001",
    number: 41,
    title: "Fix flaky checkout test",
    status: "working",
    projectId: "proj_sample_web",
    activeMinutesAgo: 2,
    preview: "Reproducing the timeout locally before changing the retry.",
    unread: true,
  }),
  thread({
    id: "jam_sample_0002",
    number: 40,
    title: "Add dark mode to settings",
    status: "waiting",
    projectId: "proj_sample_web",
    activeMinutesAgo: 25,
    pull: { number: 128, title: "Add dark mode to settings" },
  }),
  thread({
    id: "jam_sample_0003",
    number: 39,
    title: "Paginate the orders endpoint",
    status: "idle",
    projectId: "proj_sample_api",
    activeMinutesAgo: 90,
    pinned: true,
  }),
  thread({
    id: "jam_sample_0004",
    number: 38,
    title: "Rate limit the public search API",
    status: "failed",
    projectId: "proj_sample_api",
    activeMinutesAgo: 60 * 5,
  }),
  thread({
    id: "jam_sample_0005",
    number: 37,
    title: "Write the getting started guide",
    status: "idle",
    projectId: "proj_sample_docs",
    activeMinutesAgo: 60 * 26,
  }),
  thread({
    id: "jam_sample_0006",
    number: 36,
    title: "Summarize last week's incidents",
    status: "idle",
    projectId: null,
    activeMinutesAgo: 60 * 50,
  }),
  thread({
    id: "jam_sample_0007",
    number: 35,
    title: "Upgrade the bundler",
    status: "archived",
    projectId: "proj_sample_web",
    activeMinutesAgo: 60 * 24 * 9,
  }),
];
