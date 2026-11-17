import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import {
  devices,
  isoMinutesAgo,
  people,
  projects,
  threads,
} from "../fixtures/world.ts";

export const sampleConnection = {
  connected: true,
  enabled: true,
  deviceId: devices[0].id,
  deviceName: devices[0].name,
  ownerId: devices[0].ownerId,
  pairedAt: isoMinutesAgo(6 * 24 * 60),
  lastSyncAt: isoMinutesAgo(2),
  endpoint: "https://mobile.example.com/connect",
} as const;

export const sampleDashboard = {
  connected: true,
  activeSessions: 2,
  owner: people.alex,
  threads: [threads.checkoutTest, threads.darkMode].map((thread) => ({
    id: thread.id,
    number: thread.number,
    title: thread.title,
    projectId: thread.projectId,
  })),
  projects: [projects.web, projects.api].map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
  })),
  updatedAt: isoMinutesAgo(2),
} as const;

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
