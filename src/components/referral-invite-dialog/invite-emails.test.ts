import { describe, expect, it } from "vitest";
import {
  addEmails,
  invitedSummary,
  inviteLabel,
  isValidInviteEmail,
  splitEmails,
} from "./invite-emails";

describe("invite addresses", () => {
  it("splits pasted lists on space, comma and semicolon", () => {
    expect(
      splitEmails("a@example.com, b@example.com;c@example.com d@example.com"),
    ).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
      "d@example.com",
    ]);
    expect(splitEmails("  ")).toEqual([]);
  });

  it("validates addresses", () => {
    expect(isValidInviteEmail("friend@example.com")).toBe(true);
    expect(isValidInviteEmail("friend@example")).toBe(false);
    expect(isValidInviteEmail("friend example.com")).toBe(false);
  });

  it("adds addresses once, ignoring case", () => {
    expect(
      addEmails(["a@example.com"], ["A@Example.com", "b@example.com"]),
    ).toEqual(["a@example.com", "b@example.com"]);
  });
});

describe("invite copy", () => {
  it("labels the send button by count", () => {
    expect(inviteLabel(1)).toBe("Invite friend");
    expect(inviteLabel(3)).toBe("Invite 3 friends");
  });

  it("warns when only some invitations went out", () => {
    expect(invitedSummary(2, 2)).toBe("2 friends invited");
    expect(invitedSummary(1, 1)).toBe("1 friend invited");
    expect(invitedSummary(1, 3)).toBe(
      "1 of 3 friends invited, some could not be reached so avoid resending the full list",
    );
  });
});
