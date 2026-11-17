import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";

export const sampleDefaults = {
  autoReviewEnabled: true,
  reviewDraftPulls: false,
  reviewerCount: 1,
  requireApproval: true,
  dismissOnPush: true,
  model: "anthropic/claude-sonnet",
  defaultProjectId: projects.web.id,
  instruction: "Focus on correctness and test coverage.",
  updatedAt: isoMinutesAgo(5 * 24 * 60),
  updatedBy: people.alex.id,
} as const;

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
