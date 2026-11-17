import { isoMinutesAgo } from "../fixtures/world.ts";

export const sampleEmailPreferences = {
  marketing: true,
  notices: {
    "thread-finished": true,
    "pull-review": true,
    "machine-alert": false,
    "weekly-digest": true,
  },
  programs: {
    "product-updates": true,
    "beta-program": false,
    "research-invites": false,
  },
  updatedAt: isoMinutesAgo(0),
} as const;

export const sampleNoticeTemplates = [
  "thread-finished",
  "pull-review",
  "machine-alert",
  "weekly-digest",
] as const;

export const samplePrograms = [
  "product-updates",
  "beta-program",
  "research-invites",
] as const;
