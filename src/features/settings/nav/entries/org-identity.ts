import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-identity",
  label: "Identity & access",
  to: "/settings/org/identity",
  section: "organization",
  order: 260,
  icon: "lock",
  keywords:
    "security authentication sign in login sso single sign-on saml oidc okta google workspace microsoft entra",
  rows: [
    {
      id: "org-email-domains",
      title: "Domains",
      keywords:
        "allowed email domains join verified work self-join single sign-on sso required",
    },
    {
      id: "org-require-two-step",
      title: "Require two-step verification",
      keywords:
        "two-step verification 2fa mfa authenticator passkey enforce members deadline extension",
    },
  ],
};
