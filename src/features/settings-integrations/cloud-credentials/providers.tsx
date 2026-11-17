import type { ReactNode } from "react";
import type { CloudProvider } from "@/data/api/schemas/cloud-access";
import { Icon } from "@/primitives/icon";
import { AwsIcon, AzureIcon, GoogleCloudIcon, VaultIcon } from "./icons";

export type ProviderMeta = {
  name: string;
  description: string;
  icon: ReactNode;
  iconTile: "subtle" | "brand";
  guideUrl: string;
  emptyDescription: string;
  removedEffect: string;
  keptSetup: string;
  checkedByApi: boolean;
};

export const providerOrder: ReadonlyArray<CloudProvider> = [
  "gcp",
  "aws",
  "vault",
  "azure",
  "oidc",
];

export const providers: Record<CloudProvider, ProviderMeta> = {
  gcp: {
    name: "Google Cloud",
    description: "Workload Identity Federation",
    icon: <GoogleCloudIcon />,
    iconTile: "brand",
    guideUrl: "https://docs.capy.ai/cloud-credentials/gcp",
    emptyDescription:
      "Add one, and its machines sign in as the service account you choose",
    removedEffect:
      "Its machines lose their Google Cloud identity within the hour",
    keptSetup: "your trust setup in Google Cloud stays",
    checkedByApi: true,
  },
  aws: {
    name: "AWS",
    description: "IAM role with web identity",
    icon: <AwsIcon />,
    iconTile: "brand",
    guideUrl: "https://docs.capy.ai/cloud-credentials/aws",
    emptyDescription:
      "Add one, and its machines sign in as the IAM role you choose",
    removedEffect: "Its machines lose their AWS identity within the hour",
    keptSetup: "your role and trust policy in AWS stay",
    checkedByApi: true,
  },
  vault: {
    name: "Vault",
    description: "HashiCorp Vault JWT auth",
    icon: <VaultIcon />,
    iconTile: "brand",
    guideUrl: "https://docs.capy.ai/cloud-credentials/vault",
    emptyDescription:
      "Add one, and its machines log in to Vault with the role you choose",
    removedEffect: "Its machines lose their Vault login within the hour",
    keptSetup: "your auth method and role in Vault stay",
    checkedByApi: false,
  },
  azure: {
    name: "Azure",
    description: "Entra workload identity federation",
    icon: <AzureIcon />,
    iconTile: "brand",
    guideUrl: "https://docs.capy.ai/cloud-credentials/azure",
    emptyDescription:
      "Add one, and its machines sign in as the app registration you choose",
    removedEffect: "Its machines lose their Azure identity within the hour",
    keptSetup: "your app registration and its federated credential stay",
    checkedByApi: true,
  },
  oidc: {
    name: "Generic OIDC",
    description: "Any vendor that trusts a custom OIDC provider",
    icon: <Icon name="passport" />,
    iconTile: "subtle",
    guideUrl: "https://docs.capy.ai/cloud-credentials/oidc",
    emptyDescription:
      "Add one, and its machines get a token for the audience you choose",
    removedEffect: "Its machines lose their OIDC token within the hour",
    keptSetup: "your provider setup stays",
    checkedByApi: true,
  },
};

export const providerRoutes = {
  gcp: {
    list: "/settings/cloud-credentials/gcp",
    add: "/settings/cloud-credentials/gcp/new",
    target: "/settings/cloud-credentials/gcp/$targetId",
  },
  aws: {
    list: "/settings/cloud-credentials/aws",
    add: "/settings/cloud-credentials/aws/new",
    target: "/settings/cloud-credentials/aws/$targetId",
  },
  vault: {
    list: "/settings/cloud-credentials/vault",
    add: "/settings/cloud-credentials/vault/new",
    target: "/settings/cloud-credentials/vault/$targetId",
  },
  azure: {
    list: "/settings/cloud-credentials/azure",
    add: "/settings/cloud-credentials/azure/new",
    target: "/settings/cloud-credentials/azure/$targetId",
  },
  oidc: {
    list: "/settings/cloud-credentials/oidc",
    add: "/settings/cloud-credentials/oidc/new",
    target: "/settings/cloud-credentials/oidc/$targetId",
  },
} as const;

export const onlyAdminsCanRemove = "Only admins can remove";
export const onlyAdminsCanChangeOidc = "Only admins can change Generic OIDC";
