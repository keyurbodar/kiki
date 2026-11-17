import { describe, expect, it } from "vitest";
import {
  adminAccess,
  autoReviewLabel,
  customModePayload,
  errorMessage,
  heldElsewhere,
  isAddableSetting,
  isEnabledSetting,
  matchesRepo,
  type ReviewDefaults,
  type ReviewSetting,
  reviewTierState,
  setAllFailureMessage,
  settingsSubtitle,
} from "./review-model";

const row = (patch: Partial<ReviewSetting>): ReviewSetting => ({
  repo: "acme/web",
  autoReview: "off",
  postStatusCheck: false,
  billingOrgId: null,
  heldByCaller: false,
  projectId: null,
  ...patch,
});

const defaults = (patch: Partial<ReviewDefaults>): ReviewDefaults => ({
  tier: null,
  incrementalTier: "flex",
  modelPinned: false,
  incrementalModelPinned: false,
  effectiveTier: "medium",
  effectiveIncrementalTier: "medium",
  ...patch,
});

describe("review repositories model", () => {
  it("labels automatic review modes", () => {
    expect(autoReviewLabel("always")).toBe("Every push");
    expect(autoReviewLabel("once")).toBe("Once");
    expect(autoReviewLabel("weekly")).toBe("weekly");
  });

  it("splits enabled, addable and elsewhere-billed repositories", () => {
    const elsewhere = row({ billingOrgId: "org_other", heldByCaller: false });
    expect(heldElsewhere(elsewhere)).toBe(true);
    expect(isAddableSetting(elsewhere)).toBe(false);
    expect(isAddableSetting(row({}))).toBe(true);
    expect(isEnabledSetting(row({}))).toBe(false);
    expect(isEnabledSetting(row({ postStatusCheck: true }))).toBe(true);
    expect(isEnabledSetting(row({ autoReview: "once" }))).toBe(true);
  });

  it("matches repositories case-insensitively, ignoring outer spaces", () => {
    expect(matchesRepo("acme/Web", " web ")).toBe(true);
    expect(matchesRepo("acme/api", "web")).toBe(false);
  });

  it("describes the personal switch", () => {
    expect(settingsSubtitle({ selfReviewed: true, selfLogin: "sam" })).toBe(
      "Reviews run on pull requests sam authors when the repository and filters allow",
    );
    expect(settingsSubtitle({ selfReviewed: false, selfLogin: "sam" })).toBe(
      "Reviews skip pull requests sam authors",
    );
    expect(settingsSubtitle({ selfReviewed: true, selfLogin: null })).toBe(
      "Connect your GitHub account to control reviews on your own pull requests",
    );
  });

  it("names the failures of a bulk change", () => {
    expect(setAllFailureMessage(["acme/web"])).toBe(
      "Could not update acme/web",
    );
    expect(setAllFailureMessage(["acme/web", "acme/api"])).toBe(
      "Could not update 2 repositories",
    );
  });

  it("only lets admins and owners change settings", () => {
    expect(adminAccess("owner").isAdmin).toBe(true);
    expect(adminAccess("admin").adminReason).toBeUndefined();
    expect(adminAccess("member")).toEqual({
      isAdmin: false,
      adminReason: "Only organization admins can change this",
    });
  });

  it("prefers the server's error message", () => {
    expect(
      errorMessage({ message: "Repository is archived" }, "Fallback"),
    ).toBe("Repository is archived");
    expect(errorMessage({ message: "" }, "Fallback")).toBe("Fallback");
    expect(errorMessage(new Error(), "Fallback")).toBe("Fallback");
  });
});

describe("review tier state", () => {
  it("reads Flex from the follow-up tier", () => {
    expect(reviewTierState(defaults({})).flex).toBe(true);
    expect(reviewTierState(defaults({ incrementalTier: null })).flex).toBe(
      false,
    );
  });

  it("detects a model pinned outside the tiers", () => {
    const state = reviewTierState(
      defaults({
        modelPinned: true,
        effectiveTier: null,
        incrementalTier: "high",
      }),
    );
    expect(state.firstPinned).toBe(true);
    expect(state.pinnedFollowUp).toBe("high");
    expect(
      reviewTierState(
        defaults({
          incrementalTier: null,
          incrementalModelPinned: true,
          effectiveIncrementalTier: null,
        }),
      ).followUpPinned,
    ).toBe(true);
  });

  it("switches to Custom keeping a pinned follow-up tier", () => {
    expect(customModePayload(defaults({}))).toEqual({ incrementalTier: null });
    expect(
      customModePayload(
        defaults({
          incrementalModelPinned: true,
          effectiveIncrementalTier: "low",
        }),
      ),
    ).toEqual({ incrementalTier: "low" });
    expect(
      customModePayload(
        defaults({
          incrementalModelPinned: true,
          effectiveIncrementalTier: null,
        }),
      ),
    ).toEqual({ incrementalTier: "medium" });
  });
});
