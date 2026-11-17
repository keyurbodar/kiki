import { describe, expect, it } from "vitest";
import { buildCron, nextSchedule, parseCron } from "./schedule";

describe("parseCron", () => {
  it("reads every preset Capy offers", () => {
    expect(parseCron("*/10 * * * *")).toMatchObject({
      preset: "minutes",
      interval: "10",
    });
    expect(parseCron("0 */6 * * *")).toMatchObject({
      preset: "hourly",
      interval: "6",
    });
    expect(parseCron("30 9 * * *")).toMatchObject({
      preset: "daily",
      time: "09:30",
    });
    expect(parseCron("0 8 * * 1-5")).toMatchObject({
      preset: "weekdays",
      time: "08:00",
    });
    expect(parseCron("0 8 * * 3")).toMatchObject({
      preset: "weekly",
      day: "3",
    });
  });

  it("falls back to custom for anything else", () => {
    expect(parseCron("0 9 1 * *").preset).toBe("custom");
    expect(parseCron("bad").preset).toBe("custom");
    expect(parseCron("99 9 * * *").preset).toBe("custom");
  });
});

describe("buildCron", () => {
  it("round-trips the presets", () => {
    for (const cron of [
      "*/15 * * * *",
      "0 */2 * * *",
      "5 7 * * *",
      "0 9 * * 1-5",
      "0 9 * * 0",
    ])
      expect(buildCron(parseCron(cron))).toBe(cron);
  });

  it("rejects custom, bad times and empty intervals", () => {
    expect(
      buildCron({ preset: "custom", time: "09:00", day: "1", interval: "6" }),
    ).toBeNull();
    expect(
      buildCron({ preset: "daily", time: "9", day: "1", interval: "6" }),
    ).toBeNull();
    expect(
      buildCron({ preset: "hourly", time: "09:00", day: "1", interval: "" }),
    ).toBeNull();
  });
});

describe("nextSchedule", () => {
  it("picks the next free hour in the same timezone", () => {
    const first = {
      type: "schedule" as const,
      cron: "0 9 * * *",
      timezone: "UTC",
    };
    const second = {
      type: "schedule" as const,
      cron: "0 10 * * *",
      timezone: "UTC",
    };
    expect(nextSchedule(first, [first, second]).cron).toBe("0 11 * * *");
    expect(nextSchedule(first, [first]).timezone).toBe("UTC");
  });

  it("wraps past midnight", () => {
    const late = {
      type: "schedule" as const,
      cron: "15 23 * * 1-5",
      timezone: "UTC",
    };
    expect(nextSchedule(late, [late]).cron).toBe("15 0 * * 1-5");
  });
});
