import { Schema } from "effect";
import {
  AwsRegion,
  AwsRoleArn,
  AzureId,
  awsDefaultAudience,
  azureAudience,
  type CloudAccessTarget,
  CloudAudience,
  type CloudProvider,
  GcpProjectNumber,
  GcpServiceAccountEmail,
  oidcTokenFile,
  VaultAddress,
  VaultPath,
  VaultRole,
} from "@/data/api/schemas/cloud-access";

export const isRoleArn = Schema.is(AwsRoleArn);
export const isRegion = Schema.is(AwsRegion);
export const isAudience = Schema.is(CloudAudience);
export const isAzureId = Schema.is(AzureId);
export const isProjectNumber = Schema.is(GcpProjectNumber);
export const isServiceAccountEmail = Schema.is(GcpServiceAccountEmail);
export const isVaultAddress = Schema.is(VaultAddress);
export const isVaultRole = Schema.is(VaultRole);
export const isVaultPath = Schema.is(VaultPath);

export const oidcAudienceError = (audience: string) => {
  if (!/^[a-z0-9:._/-]{3,128}$/.test(audience)) {
    return "Use 3 to 128 lowercase letters, digits, and : . _ / -";
  }
  return audience.startsWith("capy") ||
    audience === awsDefaultAudience ||
    audience === azureAudience ||
    audience.startsWith("//iam.googleapis.com/") ||
    audience.startsWith("https://iam.googleapis.com/")
    ? "This audience is reserved"
    : undefined;
};

export const subjectFor = (
  provider: CloudProvider,
  orgId: string,
  projectId: string,
  thread: string,
) =>
  provider === "azure"
    ? `org/${orgId}/project/${projectId}`
    : `org/${orgId}/project/${projectId}/thread/${thread}`;

export const oidcTokenFileVar = "$CAPY_OIDC_TOKEN_FILE";

export const oidcTokenPath = (target: Pick<CloudAccessTarget, "tokenFile">) =>
  target.tokenFile === undefined || target.tokenFile === oidcTokenFile
    ? oidcTokenFileVar
    : `$CAPY_OIDC_TOKEN_DIR${target.tokenFile.slice(target.tokenFile.lastIndexOf("/"))}`;

export const shellQuote = (value: string) =>
  /^[\w@%+=:,./-]+$/.test(value)
    ? value
    : `'${value.replaceAll("'", "'\\''")}'`;
