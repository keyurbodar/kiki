import { describe, expect, it } from "vitest";
import {
  emailNotices,
  emailPreferenceKey,
  emailPreferenceLabel,
  isEmailProgram,
  noticeInfo,
} from "./email-catalog";
import {
  noticeSubscribed,
  programSubscribed,
  readEmailPreferences,
} from "./email-preferences";

describe("email catalog", () => {
  it("validates programs", () => {
    expect(isEmailProgram("weekly")).toBe(true);
    expect(isEmailProgram("newsletter")).toBe(false);
    expect(isEmailProgram(undefined)).toBe(false);
  });

  it("keys and labels targets", () => {
    expect(emailPreferenceKey({ kind: "marketing" })).toBe("marketing");
    expect(emailPreferenceKey({ kind: "program", program: "weekly" })).toBe(
      "program:weekly",
    );
    expect(emailPreferenceKey({ kind: "notice", notice: "org_invite" })).toBe(
      "notice:org_invite",
    );
    expect(emailPreferenceLabel({ kind: "marketing" })).toBe("Marketing email");
    expect(emailPreferenceLabel({ kind: "program", program: "win_back" })).toBe(
      "Check-ins",
    );
    expect(
      emailPreferenceLabel({ kind: "notice", notice: "auto_reload_failed" }),
    ).toBe("Failed payments");
  });

  it("splits notices into account and team groups", () => {
    const account = emailNotices.filter(
      (notice) => noticeInfo(notice).group === "account",
    );
    expect(account).toEqual([
      "device_enrolled",
      "org_invite",
      "admin_signup_invite_credits",
    ]);
    expect(noticeInfo("device_enrolled").risk?.title).toBe(
      "Turn off new sign-in alerts?",
    );
  });
});

describe("readEmailPreferences", () => {
  it("reads Capy's state", () => {
    const state = readEmailPreferences({
      marketing: false,
      programs: [{ program: "weekly", subscribed: true }],
      notices: [{ template: "org_invite", subscribed: false }],
      blocked: true,
      noticesEditable: false,
    });
    expect(state.marketing).toBe(false);
    expect(state.blocked).toBe(true);
    expect(state.noticesEditable).toBe(false);
    expect(programSubscribed(state, "weekly", false)).toBe(true);
    expect(programSubscribed(state, "onboarding", false)).toBe(false);
    expect(noticeSubscribed(state, "org_invite")).toBe(false);
    expect(noticeSubscribed(state, "member_joined")).toBe(true);
  });

  it("reads keyed flags and fills defaults", () => {
    const state = readEmailPreferences({
      marketing: true,
      programs: { weekly: false, bad: "yes" },
      notices: { org_invite: true },
    });
    expect(state.programs).toEqual([{ program: "weekly", subscribed: false }]);
    expect(state.notices).toEqual([
      { template: "org_invite", subscribed: true },
    ]);
    expect(state.blocked).toBe(false);
    expect(state.noticesEditable).toBe(true);
  });
});
