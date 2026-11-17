import { describe, expect, it } from "vitest";
import { autoReviewModeLabel, pluralCount, reviewTierCost } from ".";

describe("review-mode copy", () => {
  it("prices tiers in review credits", () => {
    expect(reviewTierCost("low")).toBe("Uses 1 review credit");
    expect(reviewTierCost("high")).toBe("Uses 10 review credits");
    expect(pluralCount(1250, "credit")).toBe("1,250 credits");
  });

  it("labels auto review modes", () => {
    expect(autoReviewModeLabel("always")).toBe("Every push");
    expect(autoReviewModeLabel("unknown")).toBe("unknown");
  });
});
