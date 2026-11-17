import { describe, expect, it } from "vitest";
import { resolveActiveOrgId } from "@/data/atoms/session";
import { setupRestoreState, toOnboardingStatus } from "./use-setup-restore";
import { avatarInitials } from "./user-avatar";
import {
  logOut,
  settingsShortcutLabel,
  supportMailto,
  userDisplayName,
} from "./user-menu";

const step = (completed: boolean, skipped: boolean, name = "s") => ({
  step: name,
  completed,
  skipped,
});

describe("user menu helpers", () => {
  it("names the user from first and last name, else email", () => {
    expect(
      userDisplayName({
        firstName: " Alex ",
        lastName: "Morgan",
        email: "a@x",
      }),
    ).toBe("Alex Morgan");
    expect(
      userDisplayName({
        firstName: "",
        lastName: null,
        email: "a@example.com",
      }),
    ).toBe("a@example.com");
  });

  it("formats the settings shortcut per platform", () => {
    expect(settingsShortcutLabel(true)).toBe("\u2318,");
    expect(settingsShortcutLabel(false)).toBe("Ctrl+,");
  });

  it("builds the support mail with diagnostic context", () => {
    const href = supportMailto(undefined, "https://example.com/new");
    expect(
      href.startsWith("mailto:support@capy.ai?subject=Capy%20support&body="),
    ).toBe(true);
    expect(decodeURIComponent(href.split("body=")[1] ?? "")).toBe(
      "Diagnostic context\nUser ID: unknown\nBuild: unknown\nPage: https://example.com/new",
    );
  });

  it("takes the first and last initials", () => {
    expect(avatarInitials("Alex Morgan")).toBe("AM");
    expect(avatarInitials("  acme  ")).toBe("A");
    expect(avatarInitials("Ada B Lovelace")).toBe("AL");
  });

  it("falls back to the first organization when the selection is gone", () => {
    const orgs = [{ id: "a" }, { id: "b" }];
    expect(resolveActiveOrgId(orgs, "b")).toBe("b");
    expect(resolveActiveOrgId(orgs, "z")).toBe("a");
    expect(resolveActiveOrgId([], null)).toBeUndefined();
  });
});

describe("finish setting up", () => {
  it("reads both step and id shaped onboarding steps", () => {
    expect(
      toOnboardingStatus({
        dismissed: true,
        steps: [{ id: "a", completed: true, skipped: false }, { step: "b" }, 3],
      }),
    ).toEqual({
      dismissed: true,
      steps: [step(true, false, "a"), step(false, false, "b")],
    });
    expect(toOnboardingStatus(null)).toBeUndefined();
  });

  it("is hidden while the setup card still shows", () => {
    expect(
      setupRestoreState({ dismissed: false, steps: [step(false, false)] })
        .restorable,
    ).toBe(false);
    expect(setupRestoreState(undefined).restorable).toBe(false);
  });

  it("restores a dismissed card with work left", () => {
    expect(
      setupRestoreState({ dismissed: true, steps: [step(false, false)] })
        .restorable,
    ).toBe(true);
  });

  it("restores skipped steps once everything else is done", () => {
    const state = setupRestoreState({
      dismissed: false,
      steps: [step(true, false, "a"), step(false, true, "b")],
    });
    expect(state.restorable).toBe(true);
    expect(state.skipped.map((s) => s.step)).toEqual(["b"]);
    expect(
      setupRestoreState({ dismissed: true, steps: [step(true, false)] })
        .restorable,
    ).toBe(false);
  });
});

describe("log out", () => {
  it("signs out, then clears the organization and leaves for sign in", async () => {
    const calls: string[] = [];
    await logOut({
      signOut: async () => {
        calls.push("signOut");
      },
      clearOrganization: () => calls.push("clear"),
      goToSignIn: () => calls.push("signIn"),
    });
    expect(calls).toEqual(["signOut", "clear", "signIn"]);
  });

  it("stays put when signing out fails", async () => {
    const calls: string[] = [];
    await logOut({
      signOut: () => Promise.reject(new Error("offline")),
      clearOrganization: () => calls.push("clear"),
      goToSignIn: () => calls.push("signIn"),
    });
    expect(calls).toEqual([]);
  });
});
