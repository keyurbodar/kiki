export type AutoReviewMode = "off" | "once" | "always";

/** Capy's automatic review modes, in menu order. */
export const autoReviewModes: ReadonlyArray<{
  value: AutoReviewMode;
  label: string;
  hint: string;
}> = [
  { value: "off", label: "Off", hint: "No automatic reviews" },
  {
    value: "once",
    label: "Once",
    hint: "First review only, when a pull request opens",
  },
  {
    value: "always",
    label: "Every push",
    hint: "Each opening and every later push",
  },
];

export const autoReviewLabel = (mode: string) =>
  autoReviewModes.find((option) => option.value === mode)?.label ?? mode;

export type ReviewTier = "low" | "medium" | "high";

export const reviewTiers: ReadonlyArray<ReviewTier> = ["low", "medium", "high"];

export const reviewTierCopy: Record<
  ReviewTier,
  { label: string; description: string }
> = {
  low: {
    label: "Low",
    description: "Lowest cost, flags only high-confidence issues",
  },
  medium: { label: "Medium", description: "Balanced cost and intelligence" },
  high: {
    label: "High",
    description: "Highest intelligence, most thorough coverage",
  },
};

export const flexTierCopy = {
  label: "Flex",
  description: "Capy auto routes review for you",
} as const;

export interface ReviewSetting {
  readonly repo: string;
  readonly autoReview: AutoReviewMode;
  readonly postStatusCheck: boolean;
  readonly billingOrgId: string | null;
  readonly heldByCaller: boolean;
  readonly projectId: string | null;
}

export interface SelfAuthorPolicy {
  readonly selfReviewed: boolean;
  readonly selfLogin: string | null;
}

export interface ReviewDefaults {
  readonly tier: ReviewTier | null;
  readonly incrementalTier: ReviewTier | "flex" | null;
  readonly modelPinned: boolean;
  readonly incrementalModelPinned: boolean;
  readonly effectiveTier: ReviewTier | null;
  readonly effectiveIncrementalTier: ReviewTier | null;
}

/** Another organization pays for this repository's reviews. */
export const heldElsewhere = (row: ReviewSetting) =>
  row.billingOrgId !== null && !row.heldByCaller;

/** Rows the Enabled repositories table lists. */
export const isEnabledSetting = (row: ReviewSetting) =>
  row.autoReview !== "off" || row.postStatusCheck;

/** Rows the Add repository menu offers. */
export const isAddableSetting = (row: ReviewSetting) =>
  row.autoReview === "off" && !heldElsewhere(row);

/** Repository lists at or above this size get a search field. */
export const repoSearchThreshold = 8;

export const matchesRepo = (repo: string, search: string) =>
  repo.toLowerCase().includes(search.trim().toLowerCase());

export const settingsSubtitle = (policy: SelfAuthorPolicy) =>
  policy.selfLogin === null
    ? "Connect your GitHub account to control reviews on your own pull requests"
    : policy.selfReviewed
      ? `Reviews run on pull requests ${policy.selfLogin} authors when the repository and filters allow`
      : `Reviews skip pull requests ${policy.selfLogin} authors`;

/** How the Review tiers card renders a set of org defaults. */
export const reviewTierState = (defaults: ReviewDefaults) => {
  const flex = defaults.incrementalTier === "flex";
  const firstPinned =
    defaults.tier === null &&
    defaults.modelPinned &&
    defaults.effectiveTier === null;
  const followUpPinned =
    defaults.incrementalTier === null &&
    defaults.incrementalModelPinned &&
    defaults.effectiveIncrementalTier === null;
  const pinnedFollowUp =
    followUpPinned ||
    defaults.incrementalTier === null ||
    defaults.incrementalTier === "flex"
      ? undefined
      : defaults.incrementalTier;
  return { flex, firstPinned, followUpPinned, pinnedFollowUp };
};

/** The payload that switches the Mode menu to Custom. */
export const customModePayload = (defaults: ReviewDefaults) => ({
  incrementalTier: defaults.incrementalModelPinned
    ? (defaults.effectiveIncrementalTier ?? "medium")
    : null,
});

export const adminAccess = (accessLevel: string | undefined) => {
  const isAdmin = accessLevel === "admin" || accessLevel === "owner";
  return {
    isAdmin,
    adminReason: isAdmin
      ? undefined
      : "Only organization admins can change this",
  };
};

/** The error's own message when the server sent one, else the fallback. */
export const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
};

/** Toast copy when setting every repository's mode left some unchanged. */
export const setAllFailureMessage = (failed: ReadonlyArray<string>) =>
  failed.length === 1
    ? `Could not update ${failed[0]}`
    : `Could not update ${failed.length} repositories`;
