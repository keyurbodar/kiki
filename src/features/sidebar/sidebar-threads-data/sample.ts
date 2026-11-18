import { DateTime } from "effect";
import {
  JamId,
  ProjectId,
  PullRequestId,
  UserId,
} from "@/data/api/schemas/ids";
import { PullRequestChip, ThreadCard } from "@/data/api/schemas/thread";
import { CAPTAIN_AVATAR_BACKGROUNDS } from "@/primitives/captain-avatar";
import type { SidebarSource } from "./build-view";

const at = (now: Date, hoursAgo: number) =>
  new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

const previewCard = (now: Date) => {
  const activity = DateTime.fromDateUnsafe(at(now, 0.5));
  return new ThreadCard({
    id: JamId.make("jam_sample_2"),
    primaryMachine: { kind: "device", name: "workstation" },
    title: "Add dark mode to settings",
    titleCustom: false,
    status: "idle",
    archived: false,
    archivedIdleDays: null,
    threadNumber: 40,
    userId: UserId.make("usr_sample_1"),
    userType: "human",
    takenFromUserId: null,
    takenFromUserType: null,
    origin: "web",
    projectId: ProjectId.make("proj_web"),
    slackChannel: null,
    linearIssue: null,
    pinned: false,
    settledAt: null,
    section: null,
    member: true,
    subscribed: true,
    personal: false,
    tagIds: [],
    importing: false,
    lastModelId: null,
    pulls: [
      new PullRequestChip({
        id: PullRequestId.make("pr_sample_128"),
        repo: "acme/web",
        number: 128,
        title: "Add dark mode to settings",
        state: "ready",
        additions: 42,
        deletions: 7,
        diffBreakdown: null,
        author: "alex-sample",
        authorAvatarUrl: "",
        url: "https://github.com/acme/web/pull/128",
      }),
    ],
    createdAt: DateTime.subtract(activity, { hours: 5 }),
    updatedAt: activity,
    lastActivityAt: activity,
    preview: "Two settings screens still need the new palette.",
    sortActivityAt: activity,
    hasUnreads: false,
    mentionCount: 0,
    owed: false,
    needsYou: false,
    ask: null,
    crewNeedsYou: 0,
    participated: true,
    crewMentionCount: 0,
    needsYouEventId: null,
    captain: null,
    crewCount: 2,
    automation: null,
  });
};

const harborAvatar = {
  kind: "preset",
  value: "capy-avatar-2",
  background: CAPTAIN_AVATAR_BACKGROUNDS[1]?.value ?? "",
} as const;

const juniperAvatar = {
  kind: "preset",
  value: "capy-avatar-6",
  background: CAPTAIN_AVATAR_BACKGROUNDS[3]?.value ?? "",
} as const;

export function sampleSidebarSource(now: Date): SidebarSource {
  const card = previewCard(now);
  return {
    now,
    activeId: null,
    projects: [
      { id: "proj_web", name: "web-app", logoUrl: null },
      { id: "proj_api", name: "billing-api", logoUrl: null },
    ],
    folders: [],
    threads: [
      {
        id: "jam_sample_1",
        title: "Fix flaky checkout test",
        status: "working",
        needsYou: false,
        ask: null,
        hasUnreads: false,
        projectId: "proj_web",
        machine: { kind: "cloud", name: "Cloud" },
        settled: false,
        createdAt: at(now, 3),
        updatedAt: at(now, 0.1),
      },
      {
        id: card.id,
        title: card.title,
        status: card.status,
        needsYou: card.needsYou,
        ask: null,
        hasUnreads: card.hasUnreads,
        projectId: card.projectId,
        machine: { kind: "device", name: "workstation" },
        settled: false,
        createdAt: at(now, 5),
        updatedAt: at(now, 0.5),
        card,
        code: "WEB-40",
        description: "Settings needs the new palette on both screens.",
      },
    ],
    captains: [
      {
        id: "jam_sample_captain_1",
        name: "Harbor",
        avatar: harborAvatar,
        status: "idle",
        needsYou: false,
        ask: null,
        preview: "All checks are green on the release branch.",
        hasUnreads: false,
        crewMentionCount: 0,
        position: 0,
        createdAt: at(now, 72),
        updatedAt: at(now, 14),
      },
      {
        id: "jam_sample_captain_2",
        name: "Juniper",
        avatar: juniperAvatar,
        status: "idle",
        needsYou: false,
        ask: null,
        preview: "Two pull requests are waiting for review.",
        hasUnreads: false,
        crewMentionCount: 0,
        position: 1,
        createdAt: at(now, 48),
        updatedAt: at(now, 2),
      },
    ],
  };
}
