import type { ReactNode } from "react";
import {
  Auth0Icon,
  GoogleIcon,
  JumpCloudIcon,
  KeycloakIcon,
  MicrosoftIcon,
  OktaIcon,
  OneLoginIcon,
} from "./brand-icons";
import type {
  EnterpriseProvider,
  SamlProvider,
  SsoConnection,
  SsoProvider,
} from "./data";
import { samlProviders } from "./data";
import { KeyLongIcon } from "./icons";

export type SamlMethod = "metadataUrl" | "manual" | "metadata";
export type SamlField =
  | "metadataUrl"
  | "metadata"
  | "ssoUrl"
  | "entityId"
  | "certificate";
export type CopySource =
  | "acs"
  | "entityId"
  | "metadataUrl"
  | "acsPattern"
  | { text: string };

export type SamlProviderConfig = {
  label: string;
  icon: ReactNode;
  hint: string;
  where: string;
  copy: ReadonlyArray<readonly [string, CopySource]>;
  methods: ReadonlyArray<SamlMethod>;
  metadataUrl?: { label: string; example: string; hint: string };
  ssoUrl: readonly [string, string];
  entityId: readonly [string, string];
  certificate: string;
  from: string;
};

const attributes = [
  "Attributes to send",
  { text: "email, firstName, lastName" },
] as const;

export const samlProviderConfig: Record<SamlProvider, SamlProviderConfig> = {
  okta: {
    label: "Okta",
    icon: <OktaIcon />,
    hint: "Applications › Create App Integration › SAML 2.0",
    where:
      "In Okta, open Applications › Create App Integration › SAML 2.0, and paste these on the Configure SAML step",
    copy: [
      ["Single sign-on URL", "acs"],
      ["Audience URI (SP Entity ID)", "entityId"],
      ["Name ID format", { text: "EmailAddress" }],
      ["Application username", { text: "Email" }],
    ],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "Metadata URL",
      example:
        "https://acme.okta.com/app/exk9f2b7q1HkYz3Qd697/sso/saml/metadata",
      hint: "On the app's Sign On tab, under SAML Signing Certificates",
    },
    ssoUrl: [
      "Identity Provider Single Sign-On URL",
      "https://acme.okta.com/app/acme_capy_1/exk9f2b7q1HkYz3Qd697/sso/saml",
    ],
    entityId: [
      "Identity Provider Issuer",
      "http://www.okta.com/exk9f2b7q1HkYz3Qd697",
    ],
    certificate: "X.509 Certificate",
    from: "From the app's Sign On tab, under View SAML setup instructions",
  },
  microsoft: {
    label: "Microsoft Entra ID",
    icon: <MicrosoftIcon />,
    hint: "Enterprise applications › Create your own application",
    where:
      "In Entra, open Enterprise applications › New application › Create your own, then Single sign-on › SAML, and paste these under Basic SAML Configuration",
    copy: [
      ["Identifier (Entity ID)", "entityId"],
      ["Reply URL (Assertion Consumer Service URL)", "acs"],
    ],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "App Federation Metadata Url",
      example:
        "https://login.microsoftonline.com/1f2e3d4c-5b6a-7980-a1b2-c3d4e5f60718/federationmetadata/2007-06/federationmetadata.xml",
      hint: "Under SAML Certificates",
    },
    ssoUrl: [
      "Login URL",
      "https://login.microsoftonline.com/1f2e3d4c-5b6a-7980-a1b2-c3d4e5f60718/saml2",
    ],
    entityId: [
      "Microsoft Entra Identifier",
      "https://sts.windows.net/1f2e3d4c-5b6a-7980-a1b2-c3d4e5f60718/",
    ],
    certificate: "Certificate (Base64)",
    from: "From Single sign-on › Set up Capy and SAML Certificates",
  },
  google_saml: {
    label: "Google Workspace",
    icon: <GoogleIcon />,
    hint: "A SAML app in the Google Admin console, you choose who gets access",
    where:
      "In the Google Admin console, open Apps › Web and mobile apps › Add custom SAML app, and paste these on the Service provider details step",
    copy: [
      ["ACS URL", "acs"],
      ["Entity ID", "entityId"],
      ["Name ID format", { text: "EMAIL" }],
      ["Name ID", { text: "Basic Information › Primary email" }],
    ],
    methods: ["manual", "metadata"],
    ssoUrl: [
      "SSO URL",
      "https://accounts.google.com/o/saml2/idp?idpid=C03k9x1qz",
    ],
    entityId: [
      "Entity ID",
      "https://accounts.google.com/o/saml2?idpid=C03k9x1qz",
    ],
    certificate: "Certificate",
    from: "From the Google Identity Provider details step",
  },
  jumpcloud: {
    label: "JumpCloud",
    icon: <JumpCloudIcon />,
    hint: "SSO Applications › Custom SAML App",
    where:
      "In JumpCloud, open SSO Applications › Add New Application › Custom SAML App, and paste these on the SSO tab",
    copy: [
      ["ACS URLs", "acs"],
      ["SP Entity ID", "entityId"],
      ["SAMLSubject NameID", { text: "email" }],
      attributes,
    ],
    methods: ["manual"],
    ssoUrl: ["IDP URL", "https://sso.jumpcloud.com/saml2/acme-capy"],
    entityId: ["IdP Entity ID", "acme-capy"],
    certificate: "IDP Certificate",
    from: "From the app's SSO tab",
  },
  onelogin: {
    label: "OneLogin",
    icon: <OneLoginIcon />,
    hint: "SAML Custom Connector (Advanced)",
    where:
      "In OneLogin, add the SAML Custom Connector (Advanced) app, and paste these on its Configuration tab",
    copy: [
      ["Audience (EntityID)", "entityId"],
      ["ACS (Consumer) URL", "acs"],
      ["ACS (Consumer) URL Validator", "acsPattern"],
      attributes,
    ],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "Issuer URL",
      example: "https://app.onelogin.com/saml/metadata/5b6a7980-a1b2",
      hint: "On the SSO tab",
    },
    ssoUrl: [
      "SAML 2.0 Endpoint (HTTP)",
      "https://acme.onelogin.com/trust/saml2/http-post/sso/5b6a7980-a1b2",
    ],
    entityId: [
      "Issuer URL",
      "https://app.onelogin.com/saml/metadata/5b6a7980-a1b2",
    ],
    certificate: "X.509 Certificate",
    from: "From the app's SSO tab",
  },
  keycloak: {
    label: "Keycloak",
    icon: <KeycloakIcon />,
    hint: "A SAML client in your realm",
    where: "In Keycloak, create a SAML client in your realm, and paste these",
    copy: [
      ["Client ID", "entityId"],
      ["Valid redirect URIs", "acs"],
      ["Name ID format", { text: "email" }],
      attributes,
    ],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "SAML 2.0 Identity Provider Metadata",
      example:
        "https://sso.acme-example.com/realms/acme/protocol/saml/descriptor",
      hint: "Under Realm settings › Endpoints",
    },
    ssoUrl: [
      "SSO URL",
      "https://sso.acme-example.com/realms/acme/protocol/saml",
    ],
    entityId: ["Realm entity ID", "https://sso.acme-example.com/realms/acme"],
    certificate: "Realm RS256 certificate",
    from: "From Realm settings › Keys",
  },
  auth0: {
    label: "Auth0",
    icon: <Auth0Icon />,
    hint: "The SAML2 Web App add-on",
    where:
      "In Auth0, create a Regular Web Application, turn on the SAML2 Web App add-on, and paste these",
    copy: [["Application Callback URL", "acs"], attributes],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "Identity Provider Metadata",
      example: "https://acme.us.auth0.com/samlp/metadata/Xk3q9Lr2Pw",
      hint: "On the add-on's Usage tab",
    },
    ssoUrl: [
      "Identity Provider Login URL",
      "https://acme.us.auth0.com/samlp/Xk3q9Lr2Pw",
    ],
    entityId: ["Issuer", "urn:acme.us.auth0.com"],
    certificate: "Identity Provider Certificate",
    from: "From the add-on's Usage tab",
  },
  saml: {
    label: "Other SAML provider",
    icon: <KeyLongIcon />,
    hint: "Any SAML 2.0 identity provider",
    where: "Paste these into your identity provider",
    copy: [
      ["ACS URL", "acs"],
      ["SP entity ID", "entityId"],
      ["SP metadata URL", "metadataUrl"],
      attributes,
    ],
    methods: ["metadataUrl", "manual"],
    metadataUrl: {
      label: "IdP metadata URL",
      example: "https://idp.acme-example.com/saml/metadata",
      hint: "Capy reads the sign-in URL, entity ID and certificate from it",
    },
    ssoUrl: ["SSO URL", "https://idp.acme-example.com/saml/sso"],
    entityId: ["IdP entity ID", "https://idp.acme-example.com"],
    certificate: "X.509 certificate",
    from: "From your identity provider",
  },
};

export const providerChoices: ReadonlyArray<SamlProvider> = [
  "google_saml",
  ...samlProviders.filter((provider) => provider !== "google_saml"),
];

export const methodLabels: Record<SamlMethod, string> = {
  metadataUrl: "Metadata URL",
  manual: "Paste values",
  metadata: "Metadata file",
};

export const methodFields: Record<SamlMethod, ReadonlyArray<SamlField>> = {
  metadataUrl: ["metadataUrl"],
  metadata: ["metadata"],
  manual: ["ssoUrl", "entityId", "certificate"],
};

export const ssoAddOnPrice = (priceCents = 10000) =>
  `$${priceCents / 100} a month`;

export const singleSignOnRowId = "single-sign-on";

export const otherProvidersHint =
  "Google Workspace, Okta, Microsoft Entra ID and 5 more";

const identityProviderNames: Record<SsoProvider, string> = {
  google_workspace: "Google Workspace OAuth",
  okta: "Okta",
  microsoft: "Microsoft Entra ID",
  google_saml: "Google Workspace",
  jumpcloud: "JumpCloud",
  onelogin: "OneLogin",
  keycloak: "Keycloak",
  auth0: "Auth0",
  saml: "your identity provider",
};

export const isSamlProvider = (
  provider: SsoProvider,
): provider is SamlProvider => provider !== "google_workspace";

/** How copy refers to the identity provider in a sentence (Capy's providerName). */
export const identityProviderName = (provider: SsoProvider) =>
  identityProviderNames[provider];

/** The provider's title (Capy's samlLabel). */
export const samlLabel = (provider: SamlProvider) =>
  provider === "saml" ? "SAML provider" : samlProviderConfig[provider].label;

/** The provider's name in a domain's Single sign-on column. */
export const ssoColumnName = (provider: SsoProvider) =>
  provider === "google_workspace"
    ? "Google Workspace OAuth"
    : provider === "google_saml"
      ? "Google Workspace SAML"
      : provider === "saml"
        ? "SAML"
        : samlProviderConfig[provider].label;

export const enterpriseProviderLabels: Record<EnterpriseProvider, string> = {
  okta: "Okta",
  microsoft: "Microsoft Entra ID",
  google: "Google Workspace SAML",
  saml: "SAML",
  oidc: "OIDC",
};

export const enterpriseProviderIcons: Record<EnterpriseProvider, ReactNode> = {
  okta: <OktaIcon />,
  microsoft: <MicrosoftIcon />,
  google: <GoogleIcon />,
  saml: <KeyLongIcon />,
  oidc: <KeyLongIcon />,
};

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** The value a setup row shows for one of Capy's service provider fields. */
export const copyValue = (source: CopySource, connection: SsoConnection) => {
  if (typeof source !== "string") return source.text;
  const sp = connection.serviceProvider;
  if (sp === null) return "";
  if (source === "acs") return sp.acsUrl;
  if (source === "entityId") return sp.entityId;
  if (source === "metadataUrl") return sp.metadataUrl;
  return `^${sp.acsUrl.replace(/[./]/g, (char) => `\\${char}`)}$`;
};

export const mobileSignInNote = (domain: string) =>
  `People on ${domain} can't sign in to the Capy mobile apps yet, they sign in at capy.ai or in the desktop app`;
