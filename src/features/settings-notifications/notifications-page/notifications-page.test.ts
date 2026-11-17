import { describe, expect, it } from "vitest";
import {
  defaultNotificationPrefs,
  isCompletionSound,
  isKindEnabled,
  isOriginEnabled,
} from "./notification-prefs";
import {
  slackNotificationPreferences,
  subscribeOnMessageMode,
} from "./user-preferences";

describe("notification prefs", () => {
  it("defaults to every kind on and web-only origins", () => {
    const prefs = defaultNotificationPrefs();
    expect(isKindEnabled(prefs, "mention")).toBe(true);
    expect(isOriginEnabled(prefs, "web")).toBe(true);
    expect(isOriginEnabled(prefs, "github")).toBe(false);
    expect(
      isOriginEnabled(
        { ...prefs, origins: { github: true, web: false } },
        "web",
      ),
    ).toBe(false);
  });

  it("knows the completion sounds", () => {
    expect(isCompletionSound("chime")).toBe(true);
    expect(isCompletionSound("gong")).toBe(false);
  });
});

describe("user preferences", () => {
  it("reads the subscribe mode", () => {
    expect(subscribeOnMessageMode(undefined)).toBe("ask");
    expect(subscribeOnMessageMode({ subscribeOnMessage: "never" })).toBe(
      "never",
    );
    expect(subscribeOnMessageMode({ subscribeOnMessage: null })).toBe("ask");
  });

  it("reads Slack notification preferences", () => {
    expect(slackNotificationPreferences({ notifications: "mentions" })).toBe(
      undefined,
    );
    expect(
      slackNotificationPreferences({
        notifications: {
          slack: { enabled: true, kinds: { error: false }, origins: {} },
        },
      }),
    ).toEqual({ enabled: true, kinds: { error: false }, origins: {} });
  });
});
