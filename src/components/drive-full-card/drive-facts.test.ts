import { describe, expect, it } from "vitest";
import {
  driveFacts,
  driveUsageOnPlan,
  formatBytes,
  opensPaywall,
  recommendedDriveTier,
} from "./drive-facts";

const gb = 1024 ** 3;

describe("driveFacts", () => {
  it("parses numbers and drops unknown tiers", () => {
    expect(driveFacts({ usedBytes: 1, limitBytes: 2, tier: "pro" })).toEqual({
      usedBytes: 1,
      limitBytes: 2,
      tier: "pro",
    });
    expect(
      driveFacts({ usedBytes: 1, limitBytes: 2, tier: "gold" })?.tier,
    ).toBe(null);
    expect(driveFacts({ usedBytes: "1", limitBytes: 2 })).toBeUndefined();
    expect(driveFacts(null)).toBeUndefined();
  });
});

describe("driveUsageOnPlan", () => {
  it("names the plan when it has one", () => {
    expect(
      driveUsageOnPlan({ usedBytes: gb, limitBytes: gb, tier: "free" }),
    ).toBe("1.0 GB of 1.0 GB on Free");
    expect(
      driveUsageOnPlan({ usedBytes: 0, limitBytes: 10 * gb, tier: "credits" }),
    ).toBe("0 B of 10 GB");
  });

  it("formats bytes like Capy", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(-1)).toBe("—");
  });
});

describe("recommendedDriveTier", () => {
  it("recommends the next tier with more storage", () => {
    expect(
      recommendedDriveTier({ usedBytes: 0, limitBytes: gb, tier: "free" }),
    ).toBe("lite");
    expect(
      recommendedDriveTier({ usedBytes: 0, limitBytes: 25 * gb, tier: "pro" }),
    ).toBe("max");
  });

  it("recommends nothing at the top or on a custom limit", () => {
    expect(
      recommendedDriveTier({ usedBytes: 0, limitBytes: 50 * gb, tier: "max" }),
    ).toBeUndefined();
    expect(
      recommendedDriveTier({ usedBytes: 0, limitBytes: 3 * gb, tier: "pro" }),
    ).toBeUndefined();
    expect(
      recommendedDriveTier({ usedBytes: 0, limitBytes: gb, tier: null }),
    ).toBeUndefined();
  });

  it("opens the paywall from free and lite", () => {
    expect(opensPaywall("free")).toBe(true);
    expect(opensPaywall("lite")).toBe(true);
    expect(opensPaywall("pro")).toBe(false);
  });
});
