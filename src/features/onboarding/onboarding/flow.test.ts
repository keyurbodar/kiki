import { describe, expect, it } from "vitest";
import {
  displayName,
  fixtureView,
  invitationsSentLabel,
  nextStep,
  onboardingStart,
  previousStep,
  repositoriesLabel,
  splitEmails,
  splitName,
  stepperFor,
} from "./flow";

describe("onboarding flow", () => {
  it("walks the owner sequence forward and back", () => {
    expect(nextStep("personal", "profile")).toBe("subscription");
    expect(nextStep("team", "github")).toBe("recommended");
    expect(nextStep("team", "recommended")).toBeUndefined();
    expect(previousStep("team", "recommended")).toBe("github");
    expect(previousStep("team", "profile")).toBeUndefined();
  });

  it("walks the invitee sequence and skips a covered subscription", () => {
    expect(nextStep("invitee", "subscription")).toBe("recommended");
    expect(previousStep("invitee", "recommended")).toBe("subscription");
    expect(previousStep("invitee", "recommended", true)).toBeUndefined();
  });

  it("picks the stepper for the path", () => {
    const ids = (
      path: "personal" | "invitee",
      withPlan: boolean,
      covered: boolean,
    ) =>
      stepperFor(path, { withPlan, coveredInvitee: covered }).map((s) => s.id);
    expect(ids("personal", false, false)).toEqual([
      "workspace",
      "profile",
      "subscription",
      "github",
      "recommended",
    ]);
    expect(ids("personal", true, false).at(-1)).toBe("plan");
    expect(ids("invitee", false, false)).toEqual([
      "join",
      "subscription",
      "recommended",
    ]);
    expect(ids("invitee", false, true)).toEqual(["join", "recommended"]);
  });

  it("resolves fixtures through Capy's aliases", () => {
    expect(fixtureView("connect")).toBe("subscription");
    expect(fixtureView("source")).toBe("github");
    expect(fixtureView("reviews")).toBe("recommended");
    expect(fixtureView("yours")).toBe("profile");
    expect(fixtureView("plan")).toBe("plan");
    expect(fixtureView("nope")).toBeUndefined();
    expect(fixtureView(undefined)).toBeUndefined();
  });

  it("reads the search params", () => {
    expect(
      onboardingStart({
        fixture: "github",
        path: "team",
        githubFixture: "connected",
      }),
    ).toEqual({
      view: "github",
      path: "team",
      coveredInvitee: false,
      githubConnected: true,
    });
    expect(onboardingStart({}).path).toBe("personal");
    expect(onboardingStart({ covered: "false" }).coveredInvitee).toBe(false);
  });

  it("formats copy", () => {
    expect(splitEmails(" a@x.com, b@x.com;c@x.com  ")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
    expect(invitationsSentLabel(0)).toBe(
      "Separate addresses with commas or spaces",
    );
    expect(invitationsSentLabel(1)).toBe("1 invitation sent");
    expect(invitationsSentLabel(3)).toBe("3 invitations sent");
    expect(repositoriesLabel(1)).toBe("Capy can reach 1 repository");
    expect(repositoriesLabel(4)).toBe("Capy can reach 4 repositories");
    expect(splitName("Alex  Morgan Lee")).toEqual({
      firstName: "Alex",
      lastName: " Morgan Lee",
    });
    expect(splitName("Alex")).toEqual({ firstName: "Alex", lastName: "" });
    expect(displayName({ firstName: "Alex", lastName: null })).toBe("Alex");
  });
});
