import { describe, expect, it } from "vitest";
import { canRefer, onboardingFinished } from "./sidebar-referral-menu";

describe("onboardingFinished", () => {
  it("needs a finished onboarding on the signed-in user", () => {
    expect(
      onboardingFinished({ onboardedAt: "2026-01-01T00:00:00.000Z" }),
    ).toBe(true);
    expect(onboardingFinished({ onboardedAt: null })).toBe(false);
    expect(onboardingFinished(undefined)).toBe(false);
    expect(onboardingFinished(null)).toBe(false);
  });
});

describe("canRefer", () => {
  it("reads the flag off the referrals dashboard, not the user", () => {
    expect(canRefer({ canRefer: true })).toBe(true);
    expect(canRefer({ canRefer: false })).toBe(false);
    expect(canRefer({ code: "ACME-REFS" })).toBe(false);
    expect(canRefer(undefined)).toBe(false);
    expect(canRefer(null)).toBe(false);
  });

  it("does not treat a user profile as a dashboard", () => {
    expect(canRefer({ onboardedAt: "2026-01-01T00:00:00.000Z" })).toBe(false);
  });
});
