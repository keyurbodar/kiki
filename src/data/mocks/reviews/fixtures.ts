import { isoMinutesAgo, people, repos } from "../fixtures/world.ts";

export const sampleSelfPolicy = {
  selfLogin: people.alex.githubLogin,
  selfReviewed: false,
};

const reviewSetting = (repo: string, autoReview: boolean, offset: number) => ({
  repo,
  billingOrgId: null as string | null,
  heldByCaller: false,
  autoReview,
  postingThreshold: "always",
  postInvestigate: true,
  postNotes: true,
  postStatusCheck: true,
  projectId: null as string | null,
  memorySelection: { kind: "none" },
  updatedAt: isoMinutesAgo(offset),
});

export const sampleReviewSettings = [
  reviewSetting(repos[0]!.fullName, true, 18),
  reviewSetting(repos[1]!.fullName, false, 42),
];
