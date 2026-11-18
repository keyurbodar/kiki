import { DateTime } from "effect";
import { CaptainCard } from "../../api/schemas/captain.ts";
import { JamId, ProjectId, UserId } from "../../api/schemas/ids.ts";
import type { Row } from "../db/MockDb.ts";
import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";

export const sampleImages = [
  {
    id: "img_sample_release",
    name: "Release banner",
    url: "https://images.example.com/acme/release.png",
    uploadedBy: people.alex.id,
    createdAt: isoMinutesAgo(5),
  },
  {
    id: "img_sample_docs",
    name: "Docs cover",
    url: "https://images.example.com/acme/docs.png",
    uploadedBy: people.priya.id,
    createdAt: isoMinutesAgo(60),
  },
] as const;

export const captainMembers: Readonly<Record<string, ReadonlyArray<string>>> = {
  jam_sample_cap1: [people.alex.id, people.sam.id, people.casey.id],
  jam_sample_cap2: [people.priya.id],
} as const;

export const captainAccess: Readonly<Record<string, string>> = {
  jam_sample_cap1: "org",
  jam_sample_cap2: "members",
} as const;

export const promoteProjects = [
  projects.web,
  projects.api,
  projects.docs,
] as const;

const captainAvatars = ["capy-avatar-1", "capy-avatar-2", "capy-avatar-3"];

export const captainCard = (captain: Row<"captains">, index: number) => {
  const createdAt = DateTime.makeUnsafe(captain.createdAt);
  return new CaptainCard({
    id: JamId.make(captain.id),
    primaryMachine: undefined,
    title: captain.name,
    titleCustom: true,
    status: "idle",
    archived: false,
    archivedIdleDays: null,
    threadNumber: null,
    userId: UserId.make(captain.ownerId),
    userType: "human",
    takenFromUserId: null,
    takenFromUserType: null,
    origin: "web",
    projectId: ProjectId.make(captain.projectId),
    slackChannel: null,
    linearIssue: null,
    pinned: false,
    settledAt: undefined,
    section: undefined,
    member: true,
    subscribed: true,
    personal: false,
    tagIds: [],
    importing: false,
    lastModelId: null,
    pulls: [],
    createdAt,
    updatedAt: createdAt,
    lastActivityAt: createdAt,
    preview: captain.preview ?? null,
    sortActivityAt: createdAt,
    hasUnreads: captain.hasUnreads ?? false,
    mentionCount: captain.crewMentionCount ?? 0,
    owed: false,
    needsYou: false,
    ask: null,
    crewNeedsYou: 0,
    participated: true,
    crewMentionCount: captain.crewMentionCount ?? 0,
    needsYouEventId: null,
    captain: undefined,
    crewCount: captain.crew.length,
    automation: undefined,
    pullCount: 0,
    pullStates: [],
    face: {
      name: captain.name,
      avatar: {
        kind: "preset",
        value: captainAvatars[index % captainAvatars.length] ?? "capy-avatar-1",
        background: "#ffffff",
      },
      description: captain.description,
    },
  });
};
