import { describe, expect, it } from "vitest";
import {
  checkedJoinSelection,
  dialogCopy,
  initials,
  joinTarget,
  joinTargetName,
  projectCountLabel,
  readInvitations,
  readJoinableOrganizations,
} from "./state";

const invitation = {
  id: "inv_1",
  orgName: "Northwind Labs",
  orgAvatarUrl: null,
  inviterName: "Alex Morgan",
  projectCount: 2,
};
const joinable = {
  orgId: "org_globex",
  orgName: "Globex",
  orgAvatarUrl: null,
  projectCount: 0,
};

describe("joinTarget", () => {
  it("joins the selected choice", () => {
    expect(joinTarget("domain:org_globex", [invitation], [joinable])).toEqual({
      kind: "organization",
      organization: joinable,
    });
    expect(joinTarget("invite:inv_1", [invitation], [joinable])).toEqual({
      kind: "invitation",
      invitation,
    });
  });

  it("falls back to the first invitation, then the first organization", () => {
    expect(joinTarget(undefined, [invitation], [joinable])?.kind).toBe(
      "invitation",
    );
    expect(joinTarget("invite:gone", [], [joinable])?.kind).toBe(
      "organization",
    );
    expect(joinTarget(undefined, [], [])).toBeUndefined();
  });

  it("names the button after the target", () => {
    expect(joinTargetName(joinTarget(undefined, [invitation], []))).toBe(
      "Northwind Labs",
    );
    expect(joinTargetName(undefined)).toBeUndefined();
  });
});

describe("checkedJoinSelection", () => {
  it("keeps a selection that still exists", () => {
    expect(
      checkedJoinSelection("domain:org_globex", [invitation], [joinable]),
    ).toBe("domain:org_globex");
  });

  it("checks the first choice otherwise", () => {
    expect(checkedJoinSelection("invite:gone", [invitation], [joinable])).toBe(
      "invite:inv_1",
    );
    expect(checkedJoinSelection(undefined, undefined, [joinable])).toBe(
      "domain:org_globex",
    );
    expect(checkedJoinSelection(undefined, [], [])).toBeUndefined();
  });
});

describe("copy helpers", () => {
  it("titles each step", () => {
    expect(dialogCopy("choose").title).toBe("Create or join organization");
    expect(dialogCopy("create").description).toBe(
      "Set up a shared workspace for your team",
    );
    expect(dialogCopy("join").title).toBe("Join organization");
  });

  it("counts projects", () => {
    expect(projectCountLabel(0)).toBe("no projects yet");
    expect(projectCountLabel(1)).toBe("1 project");
    expect(projectCountLabel(3)).toBe("3 projects");
  });

  it("takes the first and last initials", () => {
    expect(initials("Northwind Labs")).toBe("NL");
    expect(initials(" acme ")).toBe("A");
    expect(initials("Big Blue Box")).toBe("BB");
  });
});

describe("readers", () => {
  it("reads invitations and skips malformed rows", () => {
    expect(readInvitations([invitation, { id: 1 }, null])).toEqual([
      invitation,
    ]);
    expect(readInvitations("nope")).toEqual([]);
  });

  it("reads joinable organizations", () => {
    expect(readJoinableOrganizations([joinable, { orgId: "x" }])).toEqual([
      joinable,
    ]);
  });
});
