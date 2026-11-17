import { describe, expect, it } from "vitest";
import {
  readAutomation,
  readMembers,
  readServiceUsers,
  readTrigger,
} from "./read";

describe("readAutomation", () => {
  it("reads an automation and keeps known triggers", () => {
    const automation = readAutomation({
      id: "auto_sample",
      name: "Weekly changelog",
      prompt: "Write it",
      enabled: true,
      threadMode: "single",
      singleJamId: "jam_sample",
      model: { id: "acme/fast-model", reasoning: "medium" },
      triggers: [
        { type: "schedule", cron: "0 9 * * 1", timezone: "UTC" },
        {
          type: "slack",
          event: "message",
          conditions: { channels: ["general", 3] },
        },
        { type: "unknown" },
      ],
    });
    expect(automation).toMatchObject({
      enabled: true,
      threadMode: "single",
      singleJamId: "jam_sample",
      model: { id: "acme/fast-model", reasoning: "medium" },
      description: null,
      runAsKind: "human",
    });
    expect(automation?.triggers).toHaveLength(2);
    expect(automation?.triggers[1]).toMatchObject({
      conditions: { channels: ["general"] },
    });
  });

  it("rejects missing and deleted automations", () => {
    expect(readAutomation(undefined)).toBeUndefined();
    expect(readAutomation({ name: "no id" })).toBeUndefined();
    expect(readAutomation({ id: "a", deleted: true })).toBeUndefined();
    expect(readTrigger({ type: "on_demand", extra: 1 })).toEqual({
      type: "on_demand",
    });
  });
});

describe("people", () => {
  it("reads members and service users from lists or wrappers", () => {
    expect(
      readMembers({
        members: [
          { userId: "u1", name: "Alex Morgan" },
          { userId: "u2", disabledAt: "x" },
        ],
      }),
    ).toEqual([{ userId: "u1", name: "Alex Morgan", imageUrl: null }]);
    expect(readServiceUsers([{ id: "s1", name: "Release bot" }])).toEqual([
      { id: "s1", name: "Release bot", role: "member", disabledAt: null },
    ]);
  });
});
