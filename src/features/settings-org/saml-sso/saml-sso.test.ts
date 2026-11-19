import { describe, expect, it } from "vitest";
import {
  decodeAllowedDomain,
  decodeMembers,
  decodeSsoStatus,
  type SsoConnection,
} from "./data";
import {
  copyValue,
  identityProviderName,
  providerChoices,
  samlLabel,
  ssoAddOnPrice,
  ssoColumnName,
} from "./providers";
import {
  configurePayload,
  connectionDescription,
  setupFieldsFor,
} from "./saml-sso";
import { errorMessage, tableColumns } from "./ui";

const connection: SsoConnection = {
  provider: "okta",
  domain: "acme.com",
  domainId: "domain_1",
  state: "draft",
  configured: false,
  testedAt: null,
  serviceProvider: {
    acsUrl: "https://sso.example.com/saml/1/acs",
    entityId: "https://sso.example.com/saml/1",
    metadataUrl: "https://sso.example.com/saml/1/metadata",
  },
};

describe("providers", () => {
  it("lists Google Workspace SAML first", () => {
    expect(providerChoices[0]).toBe("google_saml");
    expect(providerChoices).toHaveLength(8);
  });

  it("names providers the way each surface does", () => {
    expect(samlLabel("saml")).toBe("SAML provider");
    expect(samlLabel("microsoft")).toBe("Microsoft Entra ID");
    expect(identityProviderName("saml")).toBe("your identity provider");
    expect(ssoColumnName("google_saml")).toBe("Google Workspace SAML");
    expect(ssoColumnName("saml")).toBe("SAML");
    expect(ssoAddOnPrice()).toBe("$100 a month");
  });

  it("fills the values to paste into the identity provider", () => {
    expect(copyValue("acs", connection)).toBe(
      "https://sso.example.com/saml/1/acs",
    );
    expect(copyValue("metadataUrl", connection)).toBe(
      "https://sso.example.com/saml/1/metadata",
    );
    expect(copyValue({ text: "EmailAddress" }, connection)).toBe(
      "EmailAddress",
    );
    expect(copyValue("acsPattern", connection)).toBe(
      "^https:\\/\\/sso\\.example\\.com\\/saml\\/1\\/acs$",
    );
    expect(copyValue("acs", { ...connection, serviceProvider: null })).toBe("");
  });
});

describe("SAML setup", () => {
  const values = {
    metadataUrl: " https://idp.example.com/metadata ",
    metadata: "<xml/>",
    metadataName: "idp.xml",
    ssoUrl: " https://idp.example.com/sso ",
    entityId: " https://idp.example.com ",
    certificate: "CERT",
  };

  it("builds the configure payload for each method", () => {
    expect(configurePayload("metadataUrl", values)).toEqual({
      kind: "metadataUrl",
      metadataUrl: "https://idp.example.com/metadata",
    });
    expect(configurePayload("metadata", values)).toEqual({
      kind: "metadata",
      metadata: "<xml/>",
    });
    expect(configurePayload("manual", values)).toEqual({
      kind: "manual",
      ssoUrl: "https://idp.example.com/sso",
      entityId: "https://idp.example.com",
      certificate: "CERT",
    });
  });

  it("asks only for the certificate when adding one", () => {
    expect(setupFieldsFor("certificate", "manual")).toEqual(["certificate"]);
    expect(setupFieldsFor("create", "manual")).toEqual([
      "ssoUrl",
      "entityId",
      "certificate",
    ]);
  });

  it("describes each connection state", () => {
    expect(connectionDescription(connection, "okta")).toBe(
      "Finish setting up Okta for acme.com to turn it on",
    );
    expect(
      connectionDescription({ ...connection, state: "active" }, "okta"),
    ).toBe(
      "Open this page in a private window and sign in with your acme.com address to finish",
    );
    expect(connectionDescription({ ...connection, state: "off" }, "okta")).toBe(
      "Members on acme.com sign in the way they did before",
    );
    expect(
      connectionDescription({ ...connection, state: "failed" }, "okta"),
    ).toBe("Okta for acme.com is not working, remove it and add it again");
  });

  it("leaves no blank domain in a draft with none", () => {
    expect(connectionDescription({ ...connection, domain: "" }, "okta")).toBe(
      "Finish setting up Okta to turn it on",
    );
  });
});

describe("decoding", () => {
  it("decodes undecoded SSO JSON with defaults", () => {
    const status = decodeSsoStatus({
      available: true,
      connection: { ...connection, testedAt: "2026-03-01T00:00:00Z" },
      enterprise: [{ provider: "okta", domain: "acme.com" }],
      addOn: {
        status: "cancelling",
        eligible: true,
        currentPeriodEnd: "2026-04-01T00:00:00Z",
      },
    });
    expect(status.connection?.testedAt).toEqual(
      new Date("2026-03-01T00:00:00Z"),
    );
    expect(status.addOn?.priceCents).toBe(10000);
    expect(decodeSsoStatus({}).connection).toBeNull();
  });

  it("decodes domains and members", () => {
    expect(decodeAllowedDomain({ id: "d", domain: "acme.com" })).toMatchObject({
      verification: "pending",
      dnsRecord: null,
      ssoRequired: false,
    });
    expect(
      decodeMembers([
        { id: "user_1", firstName: "Alex", lastName: "Morgan" },
      ])[0],
    ).toMatchObject({
      userId: "user_1",
      name: "Alex Morgan",
      mfaEnabled: false,
    });
  });
});

describe("ui helpers", () => {
  it("gives fluid table tracks a mobile minimum", () => {
    expect(tableColumns("minmax(8rem,1fr) minmax(9.5rem,auto) 2.5rem")).toBe(
      "minmax(8rem,1fr) minmax(var(--table-auto-min,9.5rem),auto) 2.5rem",
    );
    expect(tableColumns("minmax(0,1fr) repeat(2, 3rem)")).toBe(
      "minmax(var(--table-lead-min),1fr) 3rem 3rem",
    );
  });

  it("shows typed API messages and falls back otherwise", () => {
    expect(errorMessage(new Error("boom"), "Could not save")).toBe(
      "Could not save",
    );
    expect(
      errorMessage(
        { _tag: "capy/Forbidden", message: "Nope" },
        "Could not save",
      ),
    ).toBe("Nope");
  });
});
