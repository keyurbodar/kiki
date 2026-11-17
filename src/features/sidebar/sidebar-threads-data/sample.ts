import type { SidebarSource } from "./build-view";

const at = (now: Date, hoursAgo: number) =>
  new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

export function sampleSidebarSource(now: Date): SidebarSource {
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
    ],
    captains: [
      {
        id: "jam_sample_captain_1",
        name: "Harbor",
        avatarUrl: null,
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
        avatarUrl: null,
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
