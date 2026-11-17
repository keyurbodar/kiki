import { describe, expect, it } from "vitest";
import {
  creditsAndTrialHeading,
  formatCredits,
  formatCreditsShort,
  formatPriceCents,
  introDescription,
  introHeading,
  partnerOfferDescription,
} from "./format";
import { findPlanTier, planTierFeatures } from "./plan-tiers";

describe("promotion copy", () => {
  it("formats credits in thousandths of a dollar", () => {
    expect(formatCredits(50_000)).toBe("$50.00");
    expect(formatCreditsShort(50_000)).toBe("$50");
    expect(formatCreditsShort(12_500)).toBe("$12.50");
  });

  it("formats intro prices", () => {
    expect(formatPriceCents(500)).toBe("$5");
    expect(formatPriceCents(1999)).toBe("$19.99");
  });

  it("builds intro headings and descriptions", () => {
    const free = { trialDays: 14, introPriceCents: 0, requireCard: false };
    const paid = { trialDays: 30, introPriceCents: 500, requireCard: true };
    expect(introHeading("Capy Pro", free)).toBe("Capy Pro free for 14 days");
    expect(introHeading("Capy Lite", paid)).toBe("Capy Lite for $5");
    expect(introDescription(paid, 20)).toBe(
      "$5 for your first 30 days, then $20/mo",
    );
    expect(introDescription({ ...free, requireCard: true }, 100)).toBe(
      "Free for your first 14 days, then $100/mo",
    );
    expect(introDescription(free, 100)).toBe(
      "Free for your first 14 days with no card, then $100/mo once you add a payment method",
    );
    expect(creditsAndTrialHeading("$25", "Capy Pro", 14)).toBe(
      "$25 in credits + 14 days of Capy Pro",
    );
  });

  it("describes partner offer expiry", () => {
    expect(partnerOfferDescription("SoloFounders", null)).toBe(
      "Claim partner credits from SoloFounders with no expiry",
    );
    expect(
      partnerOfferDescription("YC Bookface", { type: "month", length: 12 }),
    ).toBe("Credits expire 12 months after claim");
    expect(
      partnerOfferDescription("YC Bookface", { type: "year", length: 1 }),
    ).toBe("Credits expire 1 year after claim");
  });

  it("knows plan tiers", () => {
    expect(findPlanTier("capy_max_300")?.monthlyCredits).toBe(330_000);
    const pro = findPlanTier("capy_pro");
    expect(pro && planTierFeatures(pro)[0]).toBe("$105/mo of usage");
    expect(findPlanTier("unknown")).toBeUndefined();
  });
});
