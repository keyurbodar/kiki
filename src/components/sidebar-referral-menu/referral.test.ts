import { describe, expect, it } from "vitest";
import { canRefer } from "./sidebar-referral-menu";

describe("canRefer", () => {
  it("needs a finished onboarding and the server's canRefer flag", () => {
    expect(
      canRefer({ onboardedAt: "2026-01-01T00:00:00.000Z", canRefer: true }),
    ).toBe(true);
    expect(canRefer({ onboardedAt: null, canRefer: true })).toBe(false);
    expect(canRefer({ onboardedAt: "2026-01-01T00:00:00.000Z" })).toBe(false);
    expect(canRefer(null)).toBe(false);
  });
});
