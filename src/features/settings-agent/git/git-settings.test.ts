import { describe, expect, it } from "vitest";
import {
  canAddBot,
  commitBranchPrefix,
  commitCommitEmail,
  readBotHealth,
  readGitSigning,
  replaceBot,
  selectedCommitAuthor,
  signingDescription,
  withoutBot,
} from "./git-settings";

describe("commit author", () => {
  it("picks the matching option and falls back to you with Capy co-author", () => {
    expect(selectedCommitAuthor("capy", false).label).toBe("Capy");
    expect(selectedCommitAuthor("user", true).label).toBe(
      "You, Capy co-author",
    );
  });
});

describe("commitBranchPrefix", () => {
  it("lowercases, validates and saves null for the default", () => {
    expect(commitBranchPrefix(" Team ", undefined)).toEqual({
      kind: "save",
      value: "team",
      next: "team",
    });
    expect(commitBranchPrefix("capy", "team")).toEqual({
      kind: "save",
      value: "capy",
      next: null,
    });
    expect(commitBranchPrefix("capy", undefined)).toEqual({
      kind: "keep",
      value: "capy",
    });
    expect(commitBranchPrefix("release", undefined)).toEqual({
      kind: "reject",
      error: "The release prefix is reserved",
    });
    expect(commitBranchPrefix("-bad", undefined)).toMatchObject({
      kind: "reject",
      error: "Use lowercase letters, numbers, or interior hyphens",
    });
  });
});

describe("commitCommitEmail", () => {
  it("clears on empty and rejects invalid addresses", () => {
    expect(commitCommitEmail("", "alex@example.com")).toEqual({
      kind: "save",
      value: "",
      next: null,
    });
    expect(commitCommitEmail("nope", undefined)).toEqual({
      kind: "reject",
      error: "Enter a valid email address",
    });
    expect(commitCommitEmail(" alex@example.com ", undefined)).toEqual({
      kind: "save",
      value: "alex@example.com",
      next: "alex@example.com",
    });
  });
});

describe("signing", () => {
  it("describes the switch from the author and key state", () => {
    const signing = readGitSigning({
      hasKey: true,
      registrationStatus: "registered",
      publicKey: "key",
      fingerprint: "ABCD",
    });
    expect(signingDescription("capy", true, signing)).toBe(
      "Available when commits are authored as you",
    );
    expect(signingDescription("user", false, signing)).toBe(
      "Sign commits with your managed GPG key",
    );
    expect(signingDescription("user", true, signing)).toBe(
      "Verified on GitHub",
    );
    expect(readGitSigning({ registrationStatus: "odd" })).toMatchObject({
      hasKey: false,
      registrationStatus: "manual_required",
      publicKey: null,
    });
  });
});

describe("bot list", () => {
  it("validates logins and edits case-insensitively", () => {
    expect(canAddBot("acme-review[bot]", [])).toBe(true);
    expect(canAddBot("Acme-Review[bot]", ["acme-review[bot]"])).toBe(false);
    expect(canAddBot("bad login", [])).toBe(false);
    expect(withoutBot(["A[bot]", "b[bot]"], "a[bot]")).toEqual(["b[bot]"]);
    expect(replaceBot(["a[bot]", "b[bot]"], "B[bot]", "c[bot]")).toEqual([
      "a[bot]",
      "c[bot]",
    ]);
  });

  it("reads bot health rows", () => {
    expect(
      readBotHealth([
        { login: "a[bot]", status: "active" },
        { login: "b[bot]", status: "unseen", suggestion: "bb[bot]" },
        { login: "c[bot]", status: "weird" },
        "junk",
      ]),
    ).toEqual([
      { login: "a[bot]", status: "active" },
      { login: "b[bot]", status: "unseen", suggestion: "bb[bot]" },
    ]);
  });
});
