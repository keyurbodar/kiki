import {
  isoMinutesAgo,
  orgId,
  people,
  projects,
  repos,
} from "../fixtures/world.ts";

export const sampleSelfPolicy = {
  selfLogin: people.alex.githubLogin,
  selfReviewed: true,
};

export type AutoReviewMode = "off" | "once" | "always";

const reviewSetting = (
  repo: string,
  autoReview: AutoReviewMode,
  projectId: string | null,
  offset: number,
) => ({
  repo,
  billingOrgId: autoReview === "off" ? null : (orgId as string | null),
  heldByCaller: autoReview !== "off",
  autoReview,
  postingThreshold: "always",
  postInvestigate: true,
  postNotes: true,
  postStatusCheck: false,
  projectId,
  memorySelection: { kind: "none" },
  updatedAt: isoMinutesAgo(offset),
});

export const sampleReviewSettings = [
  reviewSetting(repos[0]!.fullName, "always", projects.web.id, 18),
  reviewSetting(repos[1]!.fullName, "off", null, 42),
];
