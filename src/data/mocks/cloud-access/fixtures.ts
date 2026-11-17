import { DateTime } from "effect";
import {
  azureAudience,
  CloudAccess,
  CloudAccessAws,
  CloudAccessAzure,
  CloudAccessCheck,
  CloudAccessGcp,
  CloudAccessTarget,
  CloudAccessTargetId,
  CloudAccessVault,
  type CloudProvider,
  type CreateCloudAccessTargetRequest,
  oidcTokenFile,
  type UpdateCloudAccessTargetRequest,
} from "../../api/schemas/cloud-access.ts";
import { ProjectId, UserId } from "../../api/schemas/ids.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { orgId, viewer } from "../fixtures/world.ts";

export const sampleIssuer = `https://api.capy.ai/oidc/orgs/${orgId}`;

export const sampleCloudAccess = new CloudAccess({
  issuer: sampleIssuer,
  discoveryUrl: `${sampleIssuer}/.well-known/openid-configuration`,
  jwksUrl: "https://api.capy.ai/oidc/jwks.json",
  targets: [],
});

export const subjectFor = (provider: CloudProvider, projectId: string) =>
  provider === "azure"
    ? `org/${orgId}/project/${projectId}`
    : `org/${orgId}/project/${projectId}/thread/*`;

const checkedByApi = (provider: CloudProvider) => provider !== "vault";

export const passingCheck = (target: CloudAccessTarget) =>
  checkedByApi(target.provider)
    ? new CloudAccessCheck({
        at: fixtureNow,
        outcome: "ok",
        byUserId: UserId.make(viewer.id),
        principal: null,
        error: null,
        grantedPermissions:
          target.provider === "gcp" ? ["logging.logEntries.list"] : null,
      })
    : null;

type Settings = Pick<
  CloudAccessTarget,
  "audience" | "gcp" | "aws" | "vault" | "azure"
>;

const emptySettings = {
  gcp: null,
  aws: null,
  vault: null,
  azure: null,
} as const;

export const settingsFrom = (
  input: CreateCloudAccessTargetRequest | UpdateCloudAccessTargetRequest,
  current?: CloudAccessTarget,
): Settings => {
  if ("gcp" in input) {
    return {
      ...emptySettings,
      audience: current?.audience ?? "",
      gcp: new CloudAccessGcp(input.gcp),
    };
  }
  if ("aws" in input) {
    return {
      ...emptySettings,
      audience: input.aws.audience,
      aws: new CloudAccessAws({
        roleArn: input.aws.roleArn,
        region: input.aws.region,
      }),
    };
  }
  if ("vault" in input) {
    return {
      ...emptySettings,
      audience: input.vault.audience,
      vault: new CloudAccessVault({
        address: input.vault.address,
        role: input.vault.role,
        authMount: input.vault.authMount,
        namespace: input.vault.namespace,
      }),
    };
  }
  if ("azure" in input) {
    return {
      ...emptySettings,
      audience: current?.audience ?? azureAudience,
      azure: new CloudAccessAzure(input.azure),
    };
  }
  return { ...emptySettings, audience: input.audience };
};

export const makeTarget = (
  id: string,
  input: CreateCloudAccessTargetRequest,
  existing: ReadonlyArray<CloudAccessTarget>,
) => {
  const firstOidc = !existing.some(
    (target) =>
      target.projectId === input.projectId &&
      target.tokenFile === oidcTokenFile,
  );
  const target = new CloudAccessTarget({
    id: CloudAccessTargetId.make(id),
    projectId: ProjectId.make(input.projectId),
    provider: input.provider,
    subject: subjectFor(input.provider, input.projectId),
    ...settingsFrom(input),
    ...(input.provider === "oidc"
      ? {
          tokenFile: firstOidc
            ? oidcTokenFile
            : `/etc/capy/cloud-access/oidc/${input.audience.replaceAll("/", "_")}.jwt`,
        }
      : {}),
    lastCheck: null,
    createdByUserId: UserId.make(viewer.id),
    createdAt: fixtureNow,
    updatedAt: fixtureNow,
  });
  return new CloudAccessTarget({ ...target, lastCheck: passingCheck(target) });
};

export const recheck = (target: CloudAccessTarget) =>
  new CloudAccessTarget({
    ...target,
    lastCheck: passingCheck(target) ?? target.lastCheck,
  });

export const updateTarget = (
  current: CloudAccessTarget,
  input: UpdateCloudAccessTargetRequest,
) => {
  const updated = new CloudAccessTarget({
    ...current,
    ...settingsFrom(input, current),
    updatedAt: DateTime.add(current.updatedAt, { seconds: 1 }),
  });
  return new CloudAccessTarget({
    ...updated,
    lastCheck: passingCheck(updated) ?? current.lastCheck,
  });
};
