import { describe, expect, it } from "vitest";
import type { InvitationView, MemberView } from "./data";
import {
  decodeInvitation,
  decodeInvitations,
  decodeInviteOutcomes,
  decodeMember,
  decodeMembers,
} from "./data";
import {
  displayName,
  errorMessage,
  extendedDeadline,
  extensionAfter,
  invitationSortValue,
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

const member = (overrides: Partial<MemberView> = {}): MemberView => ({
  userId: "user_sample_alex",
  email: "alex@example.com",
  firstName: "Alex",
  lastName: "Morgan",
  imageUrl: null,
  accessLevel: "member",
  disabled: false,
  createdAt: new Date("2026-01-05T00:00:00.000Z"),
  githubLogin: null,
  mfaEnabled: false,
  enterpriseSso: false,
  passkeyTrusted: false,
  mfaExtendedUntil: null,
  ...overrides,
});

const invitation = (email: string): InvitationView => ({
  id: `inv_${email}`,
  email,
  invitedByUserId: "user_sample_sam",
  createdAt: new Date("2026-01-20T00:00:00.000Z"),
  expiresAt: new Date("2026-02-01T00:00:00.000Z"),
});

describe("decoding rows", () => {
  it("reads Capy's member shape", () => {
    expect(
      decodeMember({
        userId: "user_sample_priya",
        email: "priya@example.com",
        firstName: "Priya",
        lastName: "Shah",
        imageUrl: null,
        accessLevel: "admin",
        disabled: false,
        createdAt: "2026-01-05T00:00:00.000Z",
        githubLogin: "priya-sample",
        mfaEnabled: true,
        enterpriseSso: false,
        passkeyTrusted: false,
        mfaExtendedUntil: null,
      }),
    ).toMatchObject({
      userId: "user_sample_priya",
      accessLevel: "admin",
      mfaEnabled: true,
      createdAt: new Date("2026-01-05T00:00:00.000Z"),
    });
  });

  it("reads the mock's plain member row", () => {
    const decoded = decodeMember({
      id: "user_sample_casey",
      firstName: "Casey",
      lastName: "Nguyen",
      email: "casey@example.com",
      githubLogin: "casey-sample",
      role: "member",
      joinedAt: "2026-02-01T00:00:00.000Z",
      removedAt: "2026-02-10T00:00:00.000Z",
      isRemoved: true,
      mfaExtension: "2026-04-01T00:00:00.000Z",
    });
    expect(decoded).toMatchObject({
      userId: "user_sample_casey",
      accessLevel: "member",
      disabled: true,
      mfaExtendedUntil: new Date("2026-04-01T00:00:00.000Z"),
    });
  });

  it("falls back to a member role and epoch for junk", () => {
    expect(decodeMember(null)).toMatchObject({
      userId: "",
      accessLevel: "member",
      createdAt: new Date(0),
    });
    expect(decodeMember({ role: "superuser" }).accessLevel).toBe("member");
  });

  it("reads invitations from an array or the map shape", () => {
    const row = {
      id: "inv_sample_taylor",
      email: "taylor@example.com",
      invitedBy: "user_sample_sam",
      createdAt: "2026-02-01T00:00:00.000Z",
      expiresAt: "2026-02-08T00:00:00.000Z",
    };
    expect(decodeInvitations([row])).toHaveLength(1);
    expect(decodeInvitations({ invitations: [row], history: [] })).toHaveLength(
      1,
    );
    expect(decodeInvitation(row).invitedByUserId).toBe("user_sample_sam");
    expect(decodeMembers({ members: [] })).toEqual([]);
  });

  it("labels invite outcomes and defaults unknown ones to invited", () => {
    expect(
      decodeInviteOutcomes({
        ok: true,
        invitations: [{ email: "new@example.com", role: "member" }],
      }),
    ).toEqual([{ email: "new@example.com", status: "invited" }]);
    expect(
      decodeInviteOutcomes([
        { email: "a@example.com", status: "already_member" },
        { email: "nope", status: "invalid" },
      ]).map((outcome) => outcome.status),
    ).toEqual(["already_member", "invalid"]);
  });
});

describe("member names", () => {
  it("joins trimmed first and last names, falling back to email then id", () => {
    expect(
      displayName({ firstName: " Alex ", lastName: "", email: null }),
    ).toBe("Alex");
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
    const extended = member({ mfaExtendedUntil: new Date("2026-03-10") });
    expect(extensionAfter(extended, Date.parse("2026-03-01"))).toEqual(
      new Date("2026-03-10"),
    );
    expect(extensionAfter(extended, Date.parse("2026-03-11"))).toBeUndefined();
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
  const admin = member({ accessLevel: "admin" });

  it("matches name or email case-insensitively within the role filter", () => {
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
    expect(
      matchesMember(member({ passkeyTrusted: true }), "", "neither", "passkey"),
    ).toBe(false);
  });

  it("shows invitations only for all and member filters", () => {
    const pending = invitation("taylor@example.com");
    expect(matchesInvitation(pending, "TAYLOR", "all")).toBe(true);
    expect(matchesInvitation(pending, "", "member")).toBe(true);
    expect(matchesInvitation(pending, "", "admin")).toBe(false);
  });

  it("only lists disabled members as inactive", () => {
    expect(matchesInactive(member(), "", "all")).toBe(false);
    expect(matchesInactive(member({ disabled: true }), "alex", "all")).toBe(
      true,
    );
  });
});

describe("sorting", () => {
  const owner = member({
    userId: "o",
    firstName: "Zed",
    accessLevel: "owner",
  });
  const admin = member({
    userId: "a",
    firstName: "Bea",
    accessLevel: "admin",
  });
  const plain = member({ userId: "m", firstName: "Ann" });

  it("orders status by rank and breaks ties by name ascending", () => {
    const other = member({ userId: "m2", firstName: "Abe" });
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

describe("roles", () => {
  it("uses the right article", () => {
    expect(roleArticle("member")).toBe("a member");
    expect(roleArticle("admin")).toBe("an admin");
    expect(roleArticle("owner")).toBe("an owner");
  });

  it("keeps owner changes to owners and never demotes the last owner", () => {
    const owner = member({ accessLevel: "owner" });
    expect(roleItemDisabled("owner", member(), false, false)).toBe(true);
    expect(roleItemDisabled("admin", member(), false, false)).toBe(false);
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
    expect(
      summarizeInvites([
        { email: "a@x.com", status: "invited" },
        { email: "b@x.com", status: "already_member" },
        { email: "nope", status: "invalid" },
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
