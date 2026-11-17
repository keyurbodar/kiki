import { describe, expect, it } from "vitest";
import { projectCountLabel, shouldOpenInvitations } from "./invites-state";

describe("projectCountLabel", () => {
  it("matches Capy's copy", () => {
    expect(projectCountLabel(0)).toBe("no projects yet");
    expect(projectCountLabel(1)).toBe("1 project");
    expect(projectCountLabel(4)).toBe("4 projects");
  });
});

describe("shouldOpenInvitations", () => {
  it("opens once organizations load", () => {
    expect(
      shouldOpenInvitations({ organizations: [{}], failed: false, waiting: false }),
    ).toBe(true);
  });

  it("stays closed with no organizations or while refreshing", () => {
    expect(
      shouldOpenInvitations({ organizations: [], failed: false, waiting: false }),
    ).toBe(false);
    expect(
      shouldOpenInvitations({ organizations: [{}], failed: false, waiting: true }),
    ).toBe(false);
    expect(
      shouldOpenInvitations({ organizations: undefined, failed: false, waiting: true }),
    ).toBe(false);
  });

  it("opens when the organization list failed to load", () => {
    expect(
      shouldOpenInvitations({ organizations: undefined, failed: true, waiting: false }),
    ).toBe(true);
  });
});
