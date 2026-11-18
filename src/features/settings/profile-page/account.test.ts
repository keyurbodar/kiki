import { describe, expect, it } from "vitest";
import {
  fullName,
  keptEmailNote,
  readAccount,
  restoreDescription,
  sampleAccount,
  splitName,
  validateNewEmail,
} from "./account";

describe("names", () => {
  it("joins and splits a two-part name", () => {
    expect(fullName(sampleAccount)).toBe("Alex Morgan");
    expect(splitName("Alex Morgan")).toEqual({
      firstName: "Alex",
      lastName: "Morgan",
    });
  });

  it("keeps everything after the first space in the last name", () => {
    expect(splitName("  Ana Maria Silva ")).toEqual({
      firstName: "Ana",
      lastName: "Maria Silva",
    });
  });

  it("handles single names and missing accounts", () => {
    expect(splitName("Alex")).toEqual({ firstName: "Alex", lastName: "" });
    expect(splitName("   ")).toEqual({ firstName: "", lastName: "" });
    expect(fullName(undefined)).toBe("");
  });
});

describe("email changes", () => {
  it("rejects malformed addresses and the current address", () => {
    expect(validateNewEmail("not-an-email", "alex@example.com")).toBe(
      "Enter a valid email address",
    );
    expect(validateNewEmail(" ALEX@example.com ", "alex@example.com")).toBe(
      "This is already your email",
    );
  });

  it("accepts a new address regardless of case", () => {
    expect(validateNewEmail(" New@Example.com ", "alex@example.com")).toBe(
      null,
    );
  });
});

describe("copy that depends on account state", () => {
  it("explains why an email stays when it backs a sign-in", () => {
    expect(
      keptEmailNote({
        id: "e1",
        email: "alex@example.com",
        primary: true,
        verified: true,
        linkedSignIn: "github",
      }),
    ).toBe(
      "alex@example.com stays on your account because it's linked to your GitHub sign-in",
    );
    expect(
      keptEmailNote({
        id: "e2",
        email: "second@example.com",
        primary: false,
        verified: false,
      }),
    ).toBe("second@example.com could not be removed from your account");
  });

  it("adds the purge date only when the organization has one", () => {
    expect(restoreDescription({ id: "o1", name: "Acme" })).toBe(
      "Restore member access; subscriptions stay canceled and auto-reload stays off",
    );
    expect(
      restoreDescription({
        id: "o2",
        name: "Acme",
        purgesAt: new Date("2026-12-01T00:00:00Z"),
      }),
    ).toBe(
      "Restorable until Dec 1, 2026; subscriptions stay canceled and auto-reload stays off",
    );
  });
});

describe("the account endpoint's undecoded row", () => {
  it("reads the fields the page renders", () => {
    expect(
      readAccount({
        id: "user_sample_alex",
        firstName: "Alex",
        lastName: null,
        imageUrl: "https://static.example.com/avatars/alex.png",
        emails: [
          {
            id: "e1",
            email: "alex@example.com",
            primary: true,
            verified: true,
          },
          { email: "work@example.com", primary: false, verified: false },
          { nope: true },
        ],
      }),
    ).toEqual({
      id: "user_sample_alex",
      firstName: "Alex",
      lastName: null,
      imageUrl: "https://static.example.com/avatars/alex.png",
      emails: [
        {
          id: "e1",
          email: "alex@example.com",
          primary: true,
          verified: true,
        },
        {
          id: "work@example.com",
          email: "work@example.com",
          primary: false,
          verified: false,
        },
      ],
    });
  });

  it("reads nothing from a row that is not an account", () => {
    expect(readAccount(undefined)).toBe(undefined);
    expect(readAccount({})).toBe(undefined);
    expect(readAccount("user_sample_alex")).toBe(undefined);
  });

  it("keeps a sign-in link only when it names one", () => {
    const account = readAccount({
      id: "u",
      emails: [
        { id: "e", email: "a@example.com", linkedSignIn: "github" },
        { id: "f", email: "b@example.com", linkedSignIn: "magic-link" },
      ],
    });
    expect(account?.emails.map((email) => email.linkedSignIn)).toEqual([
      "github",
      undefined,
    ]);
  });
});
