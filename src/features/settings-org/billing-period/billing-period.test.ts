import { describe, expect, it } from "vitest";
import { balanceSegments, includedLine, meterWidths } from "./billing-period";

describe("meterWidths", () => {
  it("never fills past a full bar", () => {
    expect(
      meterWidths([
        { fraction: 0.7, tone: "primary" },
        { fraction: 0.6, tone: "neutral" },
        { fraction: -1, tone: "warning" },
      ]).map((segment) => segment.width),
    ).toEqual([0.7, 0.30000000000000004, 0]);
  });
});

describe("balanceSegments", () => {
  const balance = {
    unlimited: false,
    grantedCredits: 20000,
    usedCredits: 10000,
    remainingCredits: 10000,
    planRemainingCredits: 2500,
    sources: [],
  };

  it("splits the remaining balance into plan and purchased credits", () => {
    expect(balanceSegments(balance)).toEqual([
      { fraction: 0.125, tone: "primary" },
      { fraction: 0.375, tone: "neutral" },
    ]);
  });

  it("shows an empty bar for an overdrawn balance", () => {
    expect(
      balanceSegments({ ...balance, remainingCredits: -300 }).map(
        (segment) => segment.fraction,
      ),
    ).toEqual([0, 0]);
  });
});

describe("includedLine", () => {
  it("estimates hours on the default machine and medium reviews", () => {
    expect(
      includedLine(
        {
          feature: "machine_hours",
          granted: 500,
          remaining: 120,
          resetsAt: null,
        },
        "large",
      ),
    ).toBe("About 30 h on 4\u00a0CPU\u00a0/\u00a016\u00a0GB");
    expect(
      includedLine(
        {
          feature: "review_credits",
          granted: 250,
          remaining: 52,
          resetsAt: null,
        },
        "large",
      ),
    ).toBe("About 10 Medium reviews");
  });

  it("says when the balance takes over", () => {
    expect(
      includedLine(
        {
          feature: "machine_hours",
          granted: 500,
          remaining: 0,
          resetsAt: new Date(2026, 11, 3),
        },
        "large",
      ),
    ).toBe("Now using your balance until Dec 3");
  });
});
