import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "cloud-credentials",
  label: "Cloud credentials",
  to: "/settings/cloud-credentials",
  section: "personal",
  order: 150,
  icon: "cloud",
  keywords:
    "cloud access oidc issuer jwks workload identity federation service account role keyless",
  rows: [
    {
      id: "cloud-credentials-gcp",
      title: "Google Cloud",
      to: "/settings/cloud-credentials/gcp",
      keywords: "gcp workload identity federation service account",
    },
    {
      id: "cloud-credentials-aws",
      title: "AWS",
      to: "/settings/cloud-credentials/aws",
      keywords: "amazon iam role web identity",
    },
    {
      id: "cloud-credentials-vault",
      title: "Vault",
      to: "/settings/cloud-credentials/vault",
      keywords: "hashicorp jwt auth role",
    },
    {
      id: "cloud-credentials-azure",
      title: "Azure",
      to: "/settings/cloud-credentials/azure",
      keywords: "microsoft entra federated identity",
    },
    {
      id: "cloud-credentials-oidc",
      title: "Generic OIDC",
      to: "/settings/cloud-credentials/oidc",
      keywords: "custom provider token audience",
    },
  ],
};
