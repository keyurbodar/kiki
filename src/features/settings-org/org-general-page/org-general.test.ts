import { describe, expect, it } from "vitest";
import {
  adminReason,
  catalogRow,
  issuePrefixChange,
  myDefaultVisibility,
  normalizeIssuePrefix,
  organizationAccess,
  organizationNameChange,
  readIssuePrefix,
  sharingPayload,
} from "./org-general";

describe("organizationAccess", () => {
  it("lets admins and owners change settings", () => {
    expect(organizationAccess("owner")).toEqual({
      accessLevel: "owner",
      isAdmin: true,
      adminReason: undefined,
    });
    expect(organizationAccess("admin").isAdmin).toBe(true);
  });

  it("explains why members can't", () => {
    expect(organizationAccess("member")).toEqual({
      accessLevel: "member",
      isAdmin: false,
      adminReason,
    });
  });
});

describe("catalogRow", () => {
  it("reads row titles from the settings catalog", () => {
    expect(catalogRow("org-logo")).toEqual({ id: "org-logo", title: "Logo" });
    expect(catalogRow("org-default-visibility").title).toBe(
      "New work starts as",
    );
  });

  it("throws on an unknown row", () => {
    expect(() => catalogRow("nope")).toThrow("Unknown settings catalog id");
  });
});

describe("myDefaultVisibility", () => {
  it("falls back to the organization default", () => {
    expect(
      myDefaultVisibility({
        viewerDefaultVisibility: null,
        personalThreadsEnabled: true,
      }),
    ).toBe("default");
    expect(
      myDefaultVisibility({
        viewerDefaultVisibility: "private",
        personalThreadsEnabled: false,
      }),
    ).toBe("default");
  });

  it("keeps the viewer's own choice", () => {
    expect(
      myDefaultVisibility({
        viewerDefaultVisibility: "private",
        personalThreadsEnabled: true,
      }),
    ).toBe("private");
    expect(
      myDefaultVisibility({
        viewerDefaultVisibility: "org",
        personalThreadsEnabled: false,
      }),
    ).toBe("org");
  });
});

describe("sharingPayload", () => {
  it("resets the default to everyone when private work turns off", () => {
    expect(sharingPayload("private", false)).toEqual({
      defaultVisibility: "org",
      privateWork: false,
    });
    expect(sharingPayload("private", true)).toEqual({
      defaultVisibility: "private",
      privateWork: true,
    });
  });
});

describe("issue prefix", () => {
  it("keeps capital letters only", () => {
    expect(normalizeIssuePrefix("ac-me 2x")).toBe("ACMEX");
  });

  it("saves only real changes and blanks as the default", () => {
    expect(issuePrefixChange(null, "ACME")).toBeUndefined();
    expect(issuePrefixChange("ACME", "ACME")).toBeUndefined();
    expect(issuePrefixChange("", "ACME")).toEqual({ prefix: null });
    expect(issuePrefixChange("", null)).toBeUndefined();
    expect(issuePrefixChange("ACM", "ACME")).toEqual({ prefix: "ACM" });
  });

  it("reads the undecoded prefix response", () => {
    expect(readIssuePrefix({ prefix: "ACME" })).toEqual({
      prefix: "ACME",
      effective: undefined,
    });
    expect(readIssuePrefix({ prefix: null, effective: "ACM" })).toEqual({
      prefix: null,
      effective: "ACM",
    });
    expect(readIssuePrefix("nope")).toBeUndefined();
  });
});

describe("organizationNameChange", () => {
  it("ignores blank and unchanged names", () => {
    expect(organizationNameChange("  ", "Acme")).toBeUndefined();
    expect(organizationNameChange(" Acme ", "Acme")).toBeUndefined();
    expect(organizationNameChange(" Acme Labs ", "Acme")).toBe("Acme Labs");
  });
});
