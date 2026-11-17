import { describe, expect, it } from "vitest";
import {
  kickbackProgress,
  kickbackTarget,
  type ReferralSummary,
  referralLink,
  sampleReferrals,
  signedUsd,
  usd,
} from "./referrals-model";

const summary = (over: Partial<ReferralSummary>): ReferralSummary => ({
  ...sampleReferrals,
  ...over,
});

describe("money formatting", () => {
  it("formats balances and signed amounts", () => {
    expect(usd(0)).toBe("$0.00");
    expect(usd(1250.5)).toBe("$1,250.50");
    expect(signedUsd(20)).toBe("+$20.00");
    expect(signedUsd(-20)).toBe("−$20.00");
  });
});

describe("kickback progress", () => {
  it("counts qualified referrals toward the unlock", () => {
    const progress = kickbackProgress(summary({ qualifiedReferrals: 4 }));
    expect(progress).toMatchObject({
      qualified: 4,
      unlocked: false,
      percent: 40,
      caption: "6 more to unlock",
    });
  });

  it("caps the bar at the target", () => {
    expect(
      kickbackProgress(summary({ qualifiedReferrals: 14 })).qualified,
    ).toBe(kickbackTarget);
  });

  it("stays unlocked once the tier is earned", () => {
    const progress = kickbackProgress(
      summary({ qualifiedReferrals: 2, kickbackTier: "lead" }),
    );
    expect(progress.unlocked).toBe(true);
    expect(progress.caption).toBe("Permanently unlocked");
  });
});

describe("referral links", () => {
  it("encodes the code into the referrer query", () => {
    expect(referralLink("https://kiki.dev", "ACME42")).toBe(
      "https://kiki.dev/?ref=ACME42",
    );
    expect(referralLink("https://kiki.dev", "a b")).toBe(
      "https://kiki.dev/?ref=a%20b",
    );
  });
});
