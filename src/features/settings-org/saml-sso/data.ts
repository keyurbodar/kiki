import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const samlProviders = [
  "okta",
  "microsoft",
  "google_saml",
  "jumpcloud",
  "onelogin",
  "keycloak",
  "auth0",
  "saml",
] as const;

export type SamlProvider = (typeof samlProviders)[number];
export type SsoProvider = "google_workspace" | SamlProvider;
export type EnterpriseProvider =
  | "okta"
  | "microsoft"
  | "google"
  | "saml"
  | "oidc";

export type SsoConnectionState =
  | "draft"
  | "pending"
  | "active"
  | "off"
  | "suspended"
  | "failed";

export type ServiceProvider = {
  acsUrl: string;
  entityId: string;
  metadataUrl: string;
};

export type SsoConnection = {
  provider: SsoProvider;
  domain: string;
  domainId: string;
  state: SsoConnectionState;
  configured: boolean;
  testedAt: Date | null;
  serviceProvider: ServiceProvider | null;
};

export type EnterpriseConnection = {
  provider: EnterpriseProvider;
  domain: string;
};

export type SsoAddOn = {
  status: "none" | "active" | "cancelling";
  eligible: boolean;
  priceCents: number;
  currentPeriodEnd: Date | null;
};

export type SsoStatus = {
  available: boolean;
  connection: SsoConnection | null;
  enterprise: ReadonlyArray<EnterpriseConnection>;
  addOn: SsoAddOn | null;
};

export type DnsRecord = { host: string; type: string; value: string };

export type AllowedDomain = {
  id: string;
  domain: string;
  verification: "pending" | "dns" | "email";
  dnsRecord: DnsRecord | null;
  dnsMissingSince: Date | null;
  sso: SsoProvider | null;
  ssoRequired: boolean;
};

export type OrgMember = {
  userId: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  mfaEnabled: boolean;
  passkeyTrusted: boolean;
  enterpriseSso: boolean;
  mfaExtendedUntil: Date | null;
};

export type ApiKeySummary = {
  principalKind: string;
  principalUserId: string | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
};

type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const strOrNull = (value: unknown) =>
  typeof value === "string" ? value : null;
const bool = (value: unknown) => value === true;
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

export const decodeAllowedDomain = (value: unknown): AllowedDomain => {
  const r = row(value);
  const dns =
    r.dnsRecord === null || r.dnsRecord === undefined ? null : row(r.dnsRecord);
  return {
    id: str(r.id),
    domain: str(r.domain),
    verification:
      r.verification === "dns" || r.verification === "email"
        ? r.verification
        : r.verified === true
          ? "dns"
          : "pending",
    dnsRecord:
      dns === null
        ? null
        : { host: str(dns.host), type: str(dns.type), value: str(dns.value) },
    dnsMissingSince: date(r.dnsMissingSince),
    sso: (strOrNull(r.sso) as SsoProvider | null) ?? null,
    ssoRequired: bool(r.ssoRequired),
  };
};

export const decodeAllowedDomains = (value: unknown) =>
  list(value).map(decodeAllowedDomain);

const decodeConnection = (value: unknown): SsoConnection | null => {
  if (value === null || value === undefined) return null;
  const r = row(value);
  const sp =
    r.serviceProvider === null || r.serviceProvider === undefined
      ? null
      : row(r.serviceProvider);
  return {
    provider: str(r.provider, "saml") as SsoProvider,
    domain: str(r.domain),
    domainId: str(r.domainId),
    state: str(
      r.state,
      r.connected === true ? "active" : "draft",
    ) as SsoConnectionState,
    configured: bool(r.configured) || r.connected === true,
    testedAt: date(r.testedAt),
    serviceProvider:
      sp === null
        ? null
        : {
            acsUrl: str(sp.acsUrl),
            entityId: str(sp.entityId),
            metadataUrl: str(sp.metadataUrl),
          },
  };
};

export const decodeSsoStatus = (value: unknown): SsoStatus => {
  const r = row(value);
  const addOn = r.addOn === null || r.addOn === undefined ? null : row(r.addOn);
  return {
    available: bool(r.available),
    connection: decodeConnection(r.connection),
    enterprise: list(r.enterprise).map((entry) => {
      const e = row(entry);
      return {
        provider: str(e.provider, "saml") as EnterpriseProvider,
        domain: str(e.domain),
      };
    }),
    addOn:
      addOn === null
        ? null
        : {
            status: str(addOn.status, "none") as SsoAddOn["status"],
            eligible: bool(addOn.eligible),
            priceCents:
              typeof addOn.priceCents === "number" ? addOn.priceCents : 10000,
            currentPeriodEnd: date(addOn.currentPeriodEnd),
          },
  };
};

export const decodeSsoResult = (value: unknown) => ({
  connection: decodeConnection(row(value).connection),
});

export const decodeMembers = (value: unknown): ReadonlyArray<OrgMember> =>
  list(Array.isArray(value) ? value : row(value).members).map((entry) => {
    const r = row(entry);
    const name = [strOrNull(r.firstName), strOrNull(r.lastName)]
      .filter((part): part is string => part !== null && part !== "")
      .join(" ");
    return {
      userId: str(r.userId, str(r.id)),
      name: strOrNull(r.name) ?? (name === "" ? null : name),
      email: strOrNull(r.email),
      imageUrl: strOrNull(r.imageUrl),
      mfaEnabled: bool(r.mfaEnabled),
      passkeyTrusted: bool(r.passkeyTrusted),
      enterpriseSso: bool(r.enterpriseSso),
      mfaExtendedUntil: date(r.mfaExtendedUntil),
    };
  });

export const decodeApiKeys = (value: unknown): ReadonlyArray<ApiKeySummary> =>
  list(Array.isArray(value) ? value : row(value).keys).map((entry) => {
    const r = row(entry);
    return {
      principalKind: str(r.principalKind, "human"),
      principalUserId: strOrNull(r.principalUserId),
      revokedAt: date(r.revokedAt),
      expiresAt: date(r.expiresAt),
    };
  });

export const decodeAccountEmails = (value: unknown) =>
  list(row(value).emails).map((entry) => {
    const r = row(entry);
    return { email: str(r.email), verified: bool(r.verified) };
  });

export const identityKeys = {
  sso: (orgId: string) => `sso-connection:${orgId}`,
  domains: (orgId: string) => `allowed-domains:${orgId}`,
  organizations: "organizations",
};

export const ssoReactivityKeys = (orgId: string) => [
  identityKeys.sso(orgId),
  identityKeys.domains(orgId),
];

export const ssoStatusAtom = Atom.family((orgId: string) =>
  ApiClient.query("organizations", "getSsoConnection", {
    params: { orgId },
    reactivityKeys: ssoReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const allowedDomainsAtom = Atom.family((orgId: string) =>
  ApiClient.query("organizations", "listAllowedDomains", {
    params: { orgId },
    reactivityKeys: [identityKeys.domains(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const membersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    timeToLive: queryTimeToLive,
  }),
);

export const apiKeysAtom = Atom.family((orgId: string) =>
  ApiClient.query("apiKeys", "list", {
    params: { orgId },
    timeToLive: queryTimeToLive,
  }),
);

export const accountAtom = ApiClient.query("users", "getAccount", {
  timeToLive: queryTimeToLive,
});

export const addAllowedDomainAtom = ApiClient.mutation(
  "organizations",
  "addAllowedDomain",
);
export const removeAllowedDomainAtom = ApiClient.mutation(
  "organizations",
  "removeAllowedDomain",
);
export const verifyAllowedDomainAtom = ApiClient.mutation(
  "organizations",
  "verifyAllowedDomain",
);
export const setOrgSsoRequiredAtom = ApiClient.mutation(
  "organizations",
  "setOrgSsoRequired",
);
export const setMfaRequiredAtom = ApiClient.mutation(
  "organizations",
  "setMfaRequired",
);
export const connectSsoAtom = ApiClient.mutation(
  "organizations",
  "connectSsoConnection",
);
export const disconnectSsoAtom = ApiClient.mutation(
  "organizations",
  "disconnectSsoConnection",
);
export const draftSsoAtom = ApiClient.mutation(
  "organizations",
  "draftSsoConnection",
);
export const configureSsoAtom = ApiClient.mutation(
  "organizations",
  "configureSsoConnection",
);
export const setSsoActiveAtom = ApiClient.mutation(
  "organizations",
  "setSsoConnectionActive",
);
export const addSsoCertificateAtom = ApiClient.mutation(
  "organizations",
  "addSsoCertificate",
);
