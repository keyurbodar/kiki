export type ReviewTier = "low" | "medium" | "high";

/** Capy's OrgReviewDefaultValues; the org follows Flex. */
export const sampleOrgDefaults = {
  tier: null as ReviewTier | null,
  incrementalTier: "flex" as ReviewTier | "flex" | null,
  modelPinned: false,
  incrementalModelPinned: false,
  effectiveTier: "medium" as ReviewTier | null,
  effectiveIncrementalTier: "medium" as ReviewTier | null,
};
