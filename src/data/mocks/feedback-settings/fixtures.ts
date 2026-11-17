import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, projects, threads } from "../fixtures/world.ts";

export const sampleFeedbackSettings = {
  enabled: true,
  channel: "thread",
  destinationId: threads.checkoutTest.id,
  projectId: projects.web.id,
  prompt: "What could we do better in this thread?",
  notifyOwner: true,
  weeklyDigest: false,
  responseSlaMinutes: 60,
  updatedAt: isoMinutesAgo(7 * 24 * 60),
  updatedBy: people.sam.id,
} as const;

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
