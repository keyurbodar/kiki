import { isoMinutesAgo, people, projects, threads } from "../fixtures/world.ts";

export const folderThreadItems = [
  {
    id: threads.checkoutTest.id,
    folderId: "fld_sample_release",
    threadNumber: threads.checkoutTest.number,
    title: threads.checkoutTest.title,
    projectId: projects.web.id,
    ownerId: people.alex.id,
    status: "working",
    updatedAt: isoMinutesAgo(2),
    position: 0,
  },
  {
    id: threads.darkMode.id,
    folderId: "fld_sample_release",
    threadNumber: threads.darkMode.number,
    title: threads.darkMode.title,
    projectId: projects.web.id,
    ownerId: people.sam.id,
    status: "waiting",
    updatedAt: isoMinutesAgo(25),
    position: 1,
  },
  {
    id: threads.bundler.id,
    folderId: "fld_sample_release",
    threadNumber: threads.bundler.number,
    title: threads.bundler.title,
    projectId: projects.web.id,
    ownerId: people.casey.id,
    status: "idle",
    updatedAt: isoMinutesAgo(9 * 24 * 60),
    position: 2,
  },
  {
    id: threads.gettingStarted.id,
    folderId: "fld_sample_research",
    threadNumber: threads.gettingStarted.number,
    title: threads.gettingStarted.title,
    projectId: projects.docs.id,
    ownerId: people.priya.id,
    status: "idle",
    updatedAt: isoMinutesAgo(26 * 60),
    position: 0,
  },
  {
    id: threads.incidents.id,
    folderId: "fld_sample_research",
    threadNumber: threads.incidents.number,
    title: threads.incidents.title,
    projectId: null,
    ownerId: people.jordan.id,
    status: "idle",
    updatedAt: isoMinutesAgo(7 * 24 * 60),
    position: 1,
  },
] as const;

export const sampleRead = {
  ok: true,
  readAt: isoMinutesAgo(1),
} as const;
