import { describe, expect, it } from "vitest";
import type {
  AllowedDomain,
  OrgMember,
  SsoConnection,
  SsoStatus,
} from "@/features/settings-org/saml-sso";
import {
  dnsExpiry,
  domainDialogDescription,
  domainSso,
  domainSsoNote,
  emailDomain,
  isFreeEmailDomain,
  isValidDomain,
  meetsMfaLevel,
  mfaToastCopy,
  normalizeDomain,
  remainingGraceDays,
  requireSsoState,
  suggestedDomains,
} from "./identity";

const domain = (overrides: Partial<AllowedDomain> = {}): AllowedDomain => ({
  id: "domain_1",
  domain: "acme.com",
  verification: "dns",
  dnsRecord: { host: "_capy.acme.com", type: "TXT", value: "capy=1" },
  dnsMissingSince: null,
  sso: null,
  ssoRequired: false,
  ...overrides,
});

const connection = (overrides: Partial<SsoConnection> = {}): SsoConnection => ({
  provider: "okta",
  domain: "acme.com",
  domainId: "domain_1",
  state: "active",
  configured: true,
  testedAt: new Date("2026-03-01T00:00:00Z"),
  serviceProvider: null,
  ...overrides,
});

const status = (overrides: Partial<SsoStatus> = {}): SsoStatus => ({
  available: true,
  connection: null,
  enterprise: [],
  addOn: null,
  ...overrides,
});

const member = (overrides: Partial<OrgMember> = {}): OrgMember => ({
  userId: "user_1",
  name: "Alex Morgan",
  email: "alex@acme.com",
  imageUrl: null,
  mfaEnabled: false,
  passkeyTrusted: false,
  enterpriseSso: false,
  mfaExtendedUntil: null,
  ...overrides,
});

describe("domains", () => {
  it("normalizes and validates domains like Capy", () => {
    expect(normalizeDomain("  Acme.COM ")).toBe("acme.com");
    expect(isValidDomain("acme.com")).toBe(true);
    expect(isValidDomain("eu.acme.co.uk")).toBe(true);
    expect(isValidDomain("acme")).toBe(false);
    expect(isValidDomain("-acme.com")).toBe(false);
    expect(isValidDomain("acme-.com")).toBe(false);
    expect(emailDomain("Alex@Acme.com")).toBe("acme.com");
    expect(emailDomain("alex@")).toBeUndefined();
    expect(isFreeEmailDomain("Gmail.com")).toBe(true);
  });

  it("suggests verified work domains that aren't added yet", () => {
    expect(
      suggestedDomains(
        [
          { email: "alex@acme.com", verified: true },
          { email: "alex@northwind.io", verified: false },
          { email: "alex@gmail.com", verified: true },
          { email: "alex+clerk_test@test.dev", verified: true },
          { email: "a@acme.com", verified: true },
          { email: "alex@lab.dev", verified: true },
        ],
        [domain({ domain: "lab.dev" })],
      ),
    ).toEqual(["acme.com"]);
  });

  it("formats the DNS expiry seven days after the record went missing", () => {
    expect(dnsExpiry(new Date("2026-03-02T12:00:00Z"))).toBe("Mar 9");
  });

  it("describes the domain dialog by DNS state", () => {
    expect(domainDialogDescription(domain({ dnsRecord: null }))).toMatch(
      /^Verify with DNS to prove/,
    );
    expect(
      domainDialogDescription(domain({ verification: "pending" })),
    ).toMatch(/^Add this TXT record/);
    expect(domainDialogDescription(domain())).toMatch(/^Verified with DNS/);
    expect(
      domainDialogDescription(
        domain({ dnsMissingSince: new Date("2026-03-02T12:00:00Z") }),
      ),
    ).toBe(
      "The TXT record is missing, add it back at your DNS provider before Mar 9 to keep verification",
    );
  });
});

describe("domainSso", () => {
  it("prefers the org's connection, then enterprise SSO, then the domain's own", () => {
    const entry = domain();
    expect(domainSso(entry, status({ connection: connection() }))).toEqual({
      name: "Okta",
      state: undefined,
    });
    expect(
      domainSso(entry, status({ connection: connection({ state: "draft" }) })),
    ).toEqual({ name: "Okta", state: "Draft" });
    expect(
      domainSso(
        entry,
        status({ enterprise: [{ provider: "microsoft", domain: "acme.com" }] }),
      ).name,
    ).toBe("Microsoft Entra ID");
    expect(domainSso(domain({ sso: "google_workspace" }), status()).name).toBe(
      "Google Workspace OAuth",
    );
    expect(domainSso(domain({ sso: "okta" }), status()).name).toBe(
      "Single sign-on",
    );
    expect(domainSso(entry, undefined)).toEqual({
      name: undefined,
      state: undefined,
    });
  });

  it("writes the SSO note for each case", () => {
    expect(
      domainSsoNote(domain({ ssoRequired: true }), {
        name: "Okta",
        state: undefined,
      }),
    ).toBe("Members with @acme.com emails can only sign in with Okta");
    expect(domainSsoNote(domain(), { name: "Okta", state: "Draft" })).toBe(
      "Manage Okta under Single sign-on below",
    );
    expect(domainSsoNote(domain(), { name: undefined, state: undefined })).toBe(
      "Set up single sign-on below",
    );
    expect(
      domainSsoNote(domain({ verification: "pending" }), {
        name: undefined,
        state: undefined,
      }),
    ).toBe("Verify this domain with DNS to set up single sign-on");
  });
});

describe("requireSsoState", () => {
  it("hides the row until there's something to require", () => {
    expect(requireSsoState(status(), [domain()], false)).toBeNull();
  });

  it("blocks until the connection is tested", () => {
    const state = requireSsoState(
      status({ connection: connection({ testedAt: null }) }),
      [domain()],
      false,
    );
    expect(state).toMatchObject({
      checked: false,
      disabled: true,
      description: "Sign in through Okta once first",
    });
  });

  it("allows requiring an active, tested connection on verified domains", () => {
    expect(
      requireSsoState(
        status({ connection: connection() }),
        [domain({ sso: "okta" })],
        false,
      ),
    ).toEqual({
      checked: false,
      disabled: false,
      description: "Members on acme.com can still sign in another way",
      scope: "acme.com",
    });
  });

  it("reports a required org and the connection's blockers", () => {
    expect(
      requireSsoState(
        status({ connection: connection() }),
        [domain({ sso: "okta", ssoRequired: true })],
        false,
      )?.description,
    ).toBe("Members on acme.com can only sign in through Okta");
    expect(
      requireSsoState(
        status({ connection: connection({ state: "draft" }) }),
        [domain()],
        false,
      )?.description,
    ).toBe("Finish setting up Okta first");
    expect(
      requireSsoState(
        status({ connection: connection({ state: "off" }) }),
        [domain()],
        false,
      )?.description,
    ).toBe("Turn Okta on first");
    expect(
      requireSsoState(
        status({ enterprise: [{ provider: "okta", domain: "acme.com" }] }),
        [domain({ sso: "okta" })],
        false,
      )?.description,
    ).toBe("Contact us to require single sign-on for acme.com");
  });
});

describe("two-step verification", () => {
  it("counts passkeys and enterprise SSO for both levels", () => {
    expect(meetsMfaLevel(member({ mfaEnabled: true }), "any")).toBe(true);
    expect(meetsMfaLevel(member({ mfaEnabled: true }), "passkey")).toBe(false);
    expect(meetsMfaLevel(member({ passkeyTrusted: true }), "passkey")).toBe(
      true,
    );
    expect(meetsMfaLevel(member({ enterpriseSso: true }), "passkey")).toBe(
      true,
    );
    expect(meetsMfaLevel(member(), "any")).toBe(false);
  });

  it("keeps the remaining grace when switching level", () => {
    const now = Date.parse("2026-03-02T09:00:00Z");
    expect(remainingGraceDays(null, now)).toBe(0);
    expect(remainingGraceDays(new Date("2026-03-04T10:00:00Z"), now)).toBe(3);
    expect(remainingGraceDays(new Date("2026-02-01T00:00:00Z"), now)).toBe(0);
  });

  it("uses Capy's toast copy", () => {
    expect(mfaToastCopy(true, "any")).toBe("Two-step verification required");
    expect(mfaToastCopy(true, "passkey")).toBe("Passkeys required");
    expect(mfaToastCopy(false, "any")).toBe(
      "Two-step verification no longer required",
    );
  });
});
