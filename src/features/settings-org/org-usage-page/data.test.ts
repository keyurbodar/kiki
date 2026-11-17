import { describe, expect, it } from "vitest";
import {
  decodeUsageBreakdown,
  decodeUsageMembers,
  decodeUsageSeries,
  decodeUsageSummary,
  decodeUsageThreadPage,
  principalsOf,
} from "./data";

describe("org usage decoding", () => {
  it("decodes a summary with a balance and included grants", () => {
    const summary = decodeUsageSummary({
      period: {
        start: "2026-11-15T00:00:00.000Z",
        end: "2026-11-22T00:00:00.000Z",
      },
      balance: { remainingCredits: -30_000, unlimited: false },
      included: [
        { feature: "fast_mode", used: 2, granted: 10, resetsAt: null },
      ],
    });
    expect(summary.period?.start).toBe("2026-11-15T00:00:00.000Z");
    expect(summary.balance).toEqual({
      remainingCredits: -30_000,
      unlimited: false,
    });
    expect(summary.included[0]?.feature).toBe("fast_mode");
  });

  it("decodes a summary without a balance as null", () => {
    const summary = decodeUsageSummary({ period: { start: "a", end: "b" } });
    expect(summary.balance).toBeNull();
    expect(summary.included).toEqual([]);
  });

  it("decodes bucketed series with their route split", () => {
    const series = decodeUsageSeries({
      bucket: "hour",
      keys: [
        { key: "paid", label: "Billed" },
        { key: "byok", label: "BYOK" },
      ],
      buckets: [
        {
          start: "2026-11-15T16:00:00.000Z",
          end: "2026-11-15T17:00:00.000Z",
          slices: [{ key: "byok", credits: 1_000_000 }],
        },
      ],
    });
    expect(series.bucket).toBe("hour");
    expect(series.keys.map((entry) => entry.key)).toEqual(["paid", "byok"]);
    expect(series.buckets[0]?.slices[0]).toEqual({
      key: "byok",
      credits: 1_000_000,
    });
  });

  it("decodes flat points from cents into a single billed series", () => {
    const series = decodeUsageSeries([
      { date: "2026-11-12T00:00:00.000Z", credits: 920, costCents: 92 },
      { date: "2026-11-13T00:00:00.000Z", credits: 230, costCents: 23 },
    ]);
    expect(series.keys).toEqual([{ key: "paid", label: "Billed" }]);
    expect(series.buckets.map((bucket) => bucket.slices[0]?.credits)).toEqual([
      92_000, 23_000,
    ]);
  });

  it("decodes a flat thread list into one page", () => {
    const page = decodeUsageThreadPage([
      {
        threadId: "thread_1",
        title: "Retry backoff",
        credits: 2140,
        costCents: 214,
      },
    ]);
    expect(page.page).toBe(1);
    expect(page.totalThreads).toBe(1);
    expect(page.items[0]?.jamId).toBe("thread_1");
    expect(page.items[0]?.totalCredits).toBe(214_000);
    expect(page.items[0]?.dominantRoute).toBe("paid");
  });

  it("groups breakdown entries by their payload kind", () => {
    const routes = decodeUsageBreakdown([
      {
        kind: "inference",
        credits: 13200,
        costCents: 1320,
        model: "vendor/opus",
      },
      { kind: "inference", credits: 3450, costCents: 345, model: "vendor/gpt" },
      { kind: "machines", credits: 1800, costCents: 180, projectId: "prj_1" },
    ]);
    expect(routes.map((row) => row.route)).toEqual(["inference", "machines"]);
    expect(routes[0]?.credits).toBe(1_665_000);
    expect(routes[0]?.entries.map((entry) => entry.label)).toEqual([
      "vendor/opus",
      "vendor/gpt",
    ]);
    expect(routes[1]?.entries[0]?.label).toBe("prj_1");
  });

  it("decodes members and builds their principals", () => {
    const members = decodeUsageMembers([
      {
        userId: "user_1",
        name: "Sam Rivera",
        credits: 6200,
        costCents: 620,
        threads: 3,
      },
    ]);
    expect(members[0]?.principalUserId).toBe("user_1");
    expect(members[0]?.totalCredits).toBe(620_000);
    expect(members[0]?.llmCredits).toBe(620_000);
    expect(principalsOf(members).get("user_1")?.name).toBe("Sam Rivera");
  });
});
