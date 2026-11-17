import { describe, expect, it } from "vitest";
import {
  describeSchedules,
  describeTriggers,
  isTriggerType,
  triggerStatus,
} from "./triggers";

describe("describeSchedules", () => {
  it("names minute and hour intervals", () => {
    expect(
      describeSchedules([{ cron: "*/10 * * * *", timezone: "Asia/Calcutta" }]),
    ).toBe("Every 10 minutes (Asia/Calcutta)");
    expect(describeSchedules([{ cron: "0 */6 * * *", timezone: "" }])).toBe(
      "Every 6 hours (UTC)",
    );
  });

  it("describes days and times", () => {
    expect(describeSchedules([{ cron: "0 9 * * 1", timezone: "UTC" }])).toBe(
      "Monday at 9:00 AM (UTC)",
    );
    expect(
      describeSchedules([{ cron: "30 14 * * 1-5", timezone: "UTC" }]),
    ).toBe("Weekdays at 2:30 PM (UTC)");
    expect(describeSchedules([{ cron: "0 0 * * *", timezone: "UTC" }])).toBe(
      "Daily at 12:00 AM (UTC)",
    );
    expect(describeSchedules([{ cron: "0 8 15 * *", timezone: "UTC" }])).toBe(
      "Monthly on day 15 at 8:00 AM (UTC)",
    );
    expect(describeSchedules([{ cron: "0 9 * * 0,6", timezone: "UTC" }])).toBe(
      "Saturday and Sunday at 9:00 AM (UTC)",
    );
  });

  it("merges times that share days and zone", () => {
    expect(
      describeSchedules([
        { cron: "0 9 * * *", timezone: "UTC" },
        { cron: "0 17 * * *", timezone: "UTC" },
      ]),
    ).toBe("Daily at 9:00 AM and 5:00 PM (UTC)");
    expect(
      describeSchedules([{ cron: "0 1,3,5,7,9 * * *", timezone: "UTC" }]),
    ).toBe("Daily, 5 times between 1:00 AM and 9:00 AM (UTC)");
  });

  it("keeps zones apart and falls back to the raw cron", () => {
    expect(
      describeSchedules([
        { cron: "0 9 * * *", timezone: "UTC" },
        { cron: "0 9 * * *", timezone: "Europe/Berlin" },
      ]),
    ).toBe("Daily at 9:00 AM (UTC); Daily at 9:00 AM (Europe/Berlin)");
    expect(describeSchedules([{ cron: "0 9 1 1 *", timezone: "UTC" }])).toBe(
      "0 9 1 1 * (UTC)",
    );
    expect(describeSchedules([{ cron: " ", timezone: "UTC" }])).toBe(
      "Custom schedule (UTC)",
    );
    expect(describeSchedules([])).toBeUndefined();
  });
});

describe("describeTriggers", () => {
  it("summarizes the first trigger", () => {
    expect(
      describeTriggers([{ type: "github", event: "pull_request_opened" }]),
    ).toBe("On pull request opened");
    expect(describeTriggers([{ type: "on_demand" }])).toBe("Manual run");
    expect(describeTriggers([{ type: "incoming_webhook" }])).toBe(
      "On webhook request",
    );
    expect(describeTriggers([{ type: "slack", event: "message" }])).toBe(
      "On message posted",
    );
    expect(describeTriggers([])).toBeUndefined();
  });
});

describe("trigger status", () => {
  it("marks Sentry and Slack channel events as coming soon", () => {
    expect(triggerStatus({ type: "sentry", event: "any_issue" })).toBe(
      "coming_soon",
    );
    expect(triggerStatus({ type: "slack", event: "channel_created" })).toBe(
      "coming_soon",
    );
    expect(triggerStatus({ type: "slack", event: "message" })).toBe("shipped");
    expect(isTriggerType("schedule")).toBe(true);
    expect(isTriggerType("email")).toBe(false);
  });
});
