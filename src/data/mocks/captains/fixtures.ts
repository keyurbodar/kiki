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
