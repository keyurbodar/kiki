import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import {
  isoMinutesAgo,
  org,
  people,
  projects,
  repos,
} from "../fixtures/world.ts";

export const sampleSelfAuthorPolicy = {
  allowSelfReview: false,
  requireReviewFromOwner: true,
  updatedAt: isoMinutesAgo(2 * 24 * 60),
  updatedBy: people.alex.id,
} as const;

export const sampleSettings = {
  organizationId: org.id,
  autoReviewEnabled: true,
  reviewOnDraft: false,
  dismissStaleReviews: true,
  reviewerCount: 2,
  model: "anthropic/claude-sonnet",
  instructions: "Check checkout and API changes for regressions.",
  updatedAt: isoMinutesAgo(3 * 24 * 60),
  updatedBy: people.sam.id,
} as const;

export const sampleProjects = projects;
export const sampleRepos = repos;
export const sampleReviewerIds = [people.sam.id, people.priya.id];

export const updatedAt = () => DateTime.formatIso(minutesAgo(0));
