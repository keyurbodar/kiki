import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import { UserId } from "@/data/api/schemas/ids";
import type { MemberRow } from "@/data/api/schemas/member";
import {
  Invitation,
  InviteOutcome,
  OrganizationMember,
} from "@/data/api/schemas/member";
import {
  displayName,
  errorMessage,
  extendedDeadline,
  extensionAfter,
  invitationSortValue,
  isRemoved,
  matchesInactive,
  matchesInvitation,
  matchesMember,
  meetsMfa,
  memberName,
  memberSortValue,
  nextSort,
  parseEmails,
  roleArticle,
  roleItemDisabled,
  sortRows,
  summarizeInvites,
} from "./model";

const member = (overrides: Partial<OrganizationMember> = {}) =>
  new OrganizationMember({
    userId: UserId.make("user_sample_alex"),
    email: "alex@example.com",
    firstName: "Alex",
    lastName: "Morgan",
    imageUrl: null,
    accessLevel: "member",
    disabled: false,
    createdAt: DateTime.makeUnsafe("2026-01-05T00:00:00.000Z"),
    githubLogin: null,
    mfaEnabled: false,
    enterpriseSso: false,
    passkeyTrusted: false,
    mfaExtendedUntil: null,
    ...overrides,
  });

const invitation = (email: string) =>
  new Invitation({
    id: `inv_${email}`,
    email,
    invitedByUserId: UserId.make("user_sample_sam"),
    expiresAt: DateTime.makeUnsafe("2026-02-01T00:00:00.000Z"),
    createdAt: DateTime.makeUnsafe("2026-01-20T00:00:00.000Z"),
  });

describe("member names", () => {
  it("joins trimmed first and last names, falling back to email then id", () => {
    expect(displayName(member({ firstName: " Alex ", lastName: "" }))).toBe(
      "Alex",
    );
    expect(memberName(member({ firstName: null, lastName: null }))).toBe(
      "alex@example.com",
    );
    expect(
      memberName(member({ firstName: null, lastName: null, email: null })),
    ).toBe("user_sample_alex");
  });
});

describe("two-step", () => {
  it("counts SSO and passkeys always, and two-step only when any factor is allowed", () => {
    expect(meetsMfa(member({ mfaEnabled: true }), "any")).toBe(true);
    expect(meetsMfa(member({ mfaEnabled: true }), "passkey")).toBe(false);
    expect(meetsMfa(member({ passkeyTrusted: true }), "passkey")).toBe(true);
    expect(meetsMfa(member({ enterpriseSso: true }), "passkey")).toBe(true);
  });

  it("only reports an extension that runs past the cutoff", () => {
    const until = DateTime.makeUnsafe("2026-03-10T00:00:00.000Z");
    const extended = member({ mfaExtendedUntil: until });
    expect(
      extensionAfter(extended, Date.parse("2026-03-01T00:00:00.000Z")),
    ).toEqual(new Date("2026-03-10T00:00:00.000Z"));
    expect(
      extensionAfter(extended, Date.parse("2026-03-11T00:00:00.000Z")),
    ).toBeUndefined();
  });

  it("extends from the org deadline when it is still ahead, else from now", () => {
    const now = Date.parse("2026-03-01T00:00:00.000Z");
    expect(extendedDeadline("7", null, now)).toEqual(
      new Date("2026-03-08T00:00:00.000Z"),
    );
    expect(
      extendedDeadline("14", new Date("2026-03-05T00:00:00.000Z"), now),
    ).toEqual(new Date("2026-03-19T00:00:00.000Z"));
    expect(
      extendedDeadline("30", new Date("2026-02-01T00:00:00.000Z"), now),
    ).toEqual(new Date("2026-03-31T00:00:00.000Z"));
  });
});

describe("filtering", () => {
  it("matches name or email case-insensitively within the role filter", () => {
    const admin = member({ accessLevel: "admin" });
    expect(matchesMember(admin, "  MORGAN ", "all", "any")).toBe(true);
    expect(matchesMember(admin, "example", "admin", "any")).toBe(true);
    expect(matchesMember(admin, "", "owner", "any")).toBe(false);
    expect(matchesMember(admin, "zzz", "all", "any")).toBe(false);
  });

  it("treats neither as members without two-step or SSO", () => {
    expect(matchesMember(member(), "", "neither", "any")).toBe(true);
    expect(
      matchesMember(member({ mfaEnabled: true }), "", "neither", "any"),
    ).toBe(false);
  });

  it("shows invitations only for all and member filters", () => {
    const pending = invitation("taylor@example.com");
    expect(matchesInvitation(pending, "TAYLOR", "all")).toBe(true);
    expect(matchesInvitation(pending, "", "member")).toBe(true);
    expect(matchesInvitation(pending, "", "admin")).toBe(false);
  });

  it("only lists disabled members as inactive", () => {
    expect(matchesInactive(row({ isRemoved: false }), "", "all")).toBe(false);
    expect(matchesInactive(row({ isRemoved: true }), "alex", "all")).toBe(true);
  });
});

describe("sorting", () => {
  const owner = member({
    userId: UserId.make("o"),
    firstName: "Zed",
    accessLevel: "owner",
  });
  const admin = member({
    userId: UserId.make("a"),
    firstName: "Bea",
    accessLevel: "admin",
  });
  const plain = member({ userId: UserId.make("m"), firstName: "Ann" });

  it("orders status by rank and breaks ties by name ascending", () => {
    const other = member({ userId: UserId.make("m2"), firstName: "Abe" });
    const rows = sortRows(
      [plain, owner, other, admin],
      (row) => memberSortValue(row, "status"),
      "descending",
      memberName,
    );
    expect(rows.map((row) => row.firstName)).toEqual([
      "Abe",
      "Ann",
      "Bea",
      "Zed",
    ]);
  });

  it("toggles direction on the same key and resets on a new one", () => {
    expect(
      nextSort({ key: "status", direction: "ascending" }, "status"),
    ).toEqual({ key: "status", direction: "descending" });
    expect(
      nextSort({ key: "status", direction: "descending" }, "name"),
    ).toEqual({ key: "name", direction: "ascending" });
  });

  it("sorts invitations by email for name and as Invited for status", () => {
    const pending = invitation("taylor@example.com");
    expect(invitationSortValue(pending, "name")).toBe("taylor@example.com");
    expect(invitationSortValue(pending, "status")).toBe("Invited");
  });
});

const row = (overrides: Partial<MemberRow> = {}): MemberRow => ({
  id: "user_sample_alex",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@example.com",
  githubLogin: "alex-sample",
  role: "owner",
  joinedAt: "2026-01-05T00:00:00.000Z" as MemberRow["joinedAt"],
  removedAt: null,
  isRemoved: false,
  mfaExtension: null,
  ...overrides,
});

describe("member rows", () => {
  it("recognizes a removed member from the mock row", () => {
    expect(isRemoved(row())).toBe(false);
    expect(isRemoved(row({ isRemoved: true }))).toBe(true);
  });
});

describe("roles", () => {
  it("uses the right article", () => {
    expect(roleArticle("member")).toBe("a member");
    expect(roleArticle("admin")).toBe("an admin");
    expect(roleArticle("owner")).toBe("an owner");
  });

  it("keeps owner changes to owners and never demotes the last owner", () => {
    const owner = row({ role: "owner" });
    expect(
      roleItemDisabled("owner", row({ role: "member" }), false, false),
    ).toBe(true);
    expect(
      roleItemDisabled("admin", row({ role: "member" }), false, false),
    ).toBe(false);
    expect(roleItemDisabled("admin", owner, true, true)).toBe(true);
    expect(roleItemDisabled("admin", owner, true, false)).toBe(false);
  });
});

describe("invites", () => {
  it("splits on whitespace, commas and semicolons", () => {
    expect(parseEmails("a@x.com, b@x.com;\nc@x.com  ")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  it("counts sent invitations and labels skipped addresses", () => {
    const outcome = (email: string, status: InviteOutcome["status"]) =>
      new InviteOutcome({ email, status, invitation: null });
    expect(
      summarizeInvites([
        outcome("a@x.com", "invited"),
        outcome("b@x.com", "already_member"),
        outcome("nope", "invalid"),
      ]),
    ).toEqual({
      sent: 1,
      skipped: ["b@x.com (already a member)", "nope (invalid)"],
    });
  });
});

describe("errorMessage", () => {
  it("prefers a Capy API message over the fallback", () => {
    expect(
      errorMessage({ _tag: "capy/Forbidden", message: "Nope" }, "Fallback"),
    ).toBe("Nope");
    expect(errorMessage(new Error("boom"), "Fallback")).toBe("Fallback");
    expect(errorMessage(undefined, "Fallback")).toBe("Fallback");
  });
});
