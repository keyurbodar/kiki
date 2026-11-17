import { describe, expect, it } from "vitest";
import {
  archiveIdleOptions,
  archiveIdleValue,
  errorMessage,
  readAgentPreferences,
  readFeedbackSettings,
  relativeTime,
  resolveNumberDraft,
  titleTriggerChoice,
  titleTriggersFor,
} from "./agent-settings";

describe("title triggers", () => {
  it("maps trigger lists to the menu choice and back", () => {
    expect(titleTriggerChoice([])).toBe("never");
    expect(titleTriggerChoice(["pull_opened"])).toBe("pull_opened");
    expect(titleTriggerChoice(["first_run_ended"])).toBe("first_run_ended");
    expect(titleTriggerChoice(["first_run_ended", "pull_opened"])).toBe("both");
    expect(titleTriggersFor("never")).toEqual([]);
    expect(titleTriggersFor("both")).toEqual([
      "pull_opened",
      "first_run_ended",
    ]);
    expect(titleTriggersFor("pull_opened")).toEqual(["pull_opened"]);
  });
});

describe("idle archiving", () => {
  it("offers Off and Capy's day choices", () => {
    expect(archiveIdleOptions.map((option) => option.label)).toEqual([
      "Off",
      "After 3 days",
      "After 7 days",
      "After 14 days",
      "After 30 days",
      "After 90 days",
    ]);
    expect(archiveIdleValue("14")).toBe(14);
    expect(archiveIdleValue("off")).toBeNull();
    expect(archiveIdleValue("5")).toBeNull();
  });
});

describe("resolveNumberDraft", () => {
  const limits = { current: undefined, inherited: 8, min: 1, max: 100 };
  it("reverts non-integers and out-of-range values", () => {
    expect(resolveNumberDraft("", limits)).toEqual({ kind: "revert" });
    expect(resolveNumberDraft("2.5", limits)).toEqual({ kind: "revert" });
    expect(resolveNumberDraft("0", limits)).toEqual({ kind: "revert" });
    expect(resolveNumberDraft("101", limits)).toEqual({ kind: "revert" });
  });
  it("saves overrides and clears an override equal to the inherited value", () => {
    expect(resolveNumberDraft("12", limits)).toEqual({
      kind: "set",
      value: 12,
    });
    expect(resolveNumberDraft("8", { ...limits, current: 12 })).toEqual({
      kind: "set",
      value: undefined,
    });
    expect(resolveNumberDraft("8", limits)).toEqual({ kind: "keep" });
    expect(resolveNumberDraft("12", { ...limits, current: 12 })).toEqual({
      kind: "keep",
    });
  });
});

describe("readAgentPreferences", () => {
  it("reads typed overrides and ignores cleared or malformed values", () => {
    const preferences = readAgentPreferences({
      github: { prDraftDefault: null, humanMode: "listen", ciMode: "loud" },
      tasks: { concurrent: 4, nestedDepth: null },
      git: { commitAuthor: "capy", coAuthor: false, branchPrefix: "team" },
      gitSigning: { signCommits: true },
      archiveIdleAfterDays: 30,
    });
    expect(preferences.github).toEqual({ humanMode: "listen" });
    expect(preferences.tasks).toEqual({ concurrent: 4 });
    expect(preferences.git).toEqual({
      commitAuthor: "capy",
      coAuthor: false,
      branchPrefix: "team",
    });
    expect(preferences.gitSigning).toEqual({ signCommits: true });
    expect(preferences.archiveIdleAfterDays).toBe(30);
    expect(readAgentPreferences(undefined).github).toBeUndefined();
  });

  it("fills feedback settings defaults", () => {
    expect(readFeedbackSettings({ botMode: "off" })).toMatchObject({
      botMode: "off",
      humanMode: "react",
      conflictMaxThreadAgeDays: 3,
      botAllowlist: [],
      prBadge: true,
    });
  });
});

describe("errorMessage", () => {
  it("shows Capy API messages and falls back otherwise", () => {
    expect(
      errorMessage({ _tag: "capy/BadRequest", message: "Too long" }, "Nope"),
    ).toBe("Too long");
    expect(errorMessage(new Error("boom"), "Nope")).toBe("Nope");
  });
});

describe("relativeTime", () => {
  const now = Date.UTC(2026, 0, 10);
  it("formats like Capy", () => {
    expect(relativeTime(now - 2000, now)).toBe("just now");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5m ago");
    expect(relativeTime(now - 3 * 86_400_000, now)).toBe("3d ago");
    expect(relativeTime(now + 2 * 3_600_000, now)).toBe("in 2h");
  });
});
