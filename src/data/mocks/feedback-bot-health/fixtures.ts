import { isoMinutesAgo } from "../fixtures/world.ts";

export const sampleFeedbackBotHealth = [
  {
    login: "capy-review-sample",
    status: "active",
    lastSeenAt: isoMinutesAgo(2),
    suggestion: null as string | null,
  },
  {
    login: "capy-notes-sample",
    status: "stale",
    lastSeenAt: isoMinutesAgo(60 * 6),
    suggestion: "Waiting for the bot to return to the organization",
  },
];
