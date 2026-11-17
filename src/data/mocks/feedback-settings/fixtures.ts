export const sampleFeedbackSettings = {
  humanMode: "react",
  botMode: "listen",
  ciMode: "react",
  conflictMode: "react",
  conflictMaxThreadAgeDays: 3,
  botAllowlist: ["acme-review[bot]", "lint-helper[bot]"],
  prDraftDefault: false,
  prBadge: true,
} as const;
