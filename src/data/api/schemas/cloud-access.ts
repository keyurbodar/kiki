import { Schema } from "effect";
import { ProjectId, Timestamp, UserId } from "./ids.ts";

export const CloudAccessTargetId = Schema.String.pipe(
  Schema.brand("Core.CloudAccessTargetId"),
);
export type CloudAccessTargetId = typeof CloudAccessTargetId.Type;

export const CloudProvider = Schema.Literals([
  "gcp",
  "oidc",
  "aws",
  "vault",
  "azure",
]);
export type CloudProvider = typeof CloudProvider.Type;

export const CloudAccessCheckOutcome = Schema.Literals(["ok", "failed"]);
export type CloudAccessCheckOutcome = typeof CloudAccessCheckOutcome.Type;

export const oidcTokenFile = "/etc/capy/cloud-access/oidc.jwt";
export const awsTokenFile = "/etc/capy/cloud-access/aws.jwt";
export const azureTokenFile = "/etc/capy/cloud-access/azure.jwt";
export const awsDefaultAudience = "sts.amazonaws.com";
export const azureAudience = "api://AzureADTokenExchange";
export const gcpPoolId = "capy";
export const gcpProviderId = "capy";
export const vaultDefaultAuthMount = "capy";
export const vaultLoginCommand =
  'vault login -no-print "$(vault write -field=token "auth/$CAPY_VAULT_AUTH_MOUNT/login" role="$CAPY_VAULT_ROLE" jwt=@/etc/capy/cloud-access/vault.jwt)"';

export const gcpPermissions = [
  { permission: "logging.logEntries.list", label: "Read logs" },
  { permission: "cloudsql.instances.connect", label: "Connect to Cloud SQL" },
  { permission: "storage.buckets.list", label: "List buckets" },
  { permission: "storage.objects.get", label: "Read objects" },
  { permission: "storage.objects.create", label: "Write objects" },
  { permission: "bigquery.jobs.create", label: "Run BigQuery jobs" },
  { permission: "bigquery.tables.getData", label: "Read BigQuery tables" },
  { permission: "run.services.get", label: "Read Cloud Run services" },
  { permission: "run.services.update", label: "Deploy Cloud Run services" },
  { permission: "container.clusters.get", label: "Read GKE clusters" },
  { permission: "compute.instances.list", label: "List VM instances" },
  { permission: "secretmanager.versions.access", label: "Read secrets" },
  { permission: "pubsub.topics.publish", label: "Publish to Pub/Sub" },
  { permission: "monitoring.timeSeries.list", label: "Read metrics" },
] as const;

export const CloudAudience = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
  Schema.isPattern(/^[\x21-\x7e]+$/),
);
export const AwsRoleArn = Schema.String.check(
  Schema.isMaxLength(512),
  Schema.isPattern(
    /^arn:aws:iam::[0-9]{12}:role\/[A-Za-z0-9+=,.@_/-]{1,480}$/u,
  ),
);
export const AwsRegion = Schema.String.check(
  Schema.isMaxLength(32),
  Schema.isPattern(/^[a-z]{2}(-[a-z]+)+-[0-9]{1,2}$/u),
);
export const VaultAddress = Schema.String.check(
  Schema.isMaxLength(255),
  Schema.isPattern(
    /^https:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?(\/[A-Za-z0-9._~-]+)*\/?$/u,
  ),
);
export const VaultRole = Schema.String.check(
  Schema.isPattern(/^[A-Za-z0-9_.-]{1,128}$/u),
);
export const VaultPath = Schema.String.check(
  Schema.isPattern(/^[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*$/u),
  Schema.isMaxLength(128),
);
export const AzureId = Schema.String.check(
  Schema.isPattern(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
  ),
);
export const GcpProjectNumber = Schema.String.check(
  Schema.isPattern(/^[1-9][0-9]{5,19}$/u),
);
export const GcpServiceAccountEmail = Schema.String.check(
  Schema.isMaxLength(255),
  Schema.isPattern(
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$/u,
  ),
);

export class CloudAccessCheck extends Schema.Class<CloudAccessCheck>(
  "CloudAccessCheck",
)({
  at: Timestamp,
  outcome: CloudAccessCheckOutcome,
  byUserId: Schema.NullOr(UserId),
  principal: Schema.NullOr(Schema.String),
  error: Schema.NullOr(Schema.String),
  grantedPermissions: Schema.NullOr(Schema.Array(Schema.String)),
}) {}

export class CloudAccessGcp extends Schema.Class<CloudAccessGcp>(
  "CloudAccessGcp",
)({
  projectNumber: Schema.String,
  serviceAccountEmail: Schema.String,
}) {}

export class CloudAccessAws extends Schema.Class<CloudAccessAws>(
  "CloudAccessAws",
)({
  roleArn: Schema.String,
  region: Schema.NullOr(Schema.String),
}) {}

export class CloudAccessVault extends Schema.Class<CloudAccessVault>(
  "CloudAccessVault",
)({
  address: Schema.String,
  role: Schema.String,
  authMount: Schema.String,
  namespace: Schema.NullOr(Schema.String),
}) {}

export class CloudAccessAzure extends Schema.Class<CloudAccessAzure>(
  "CloudAccessAzure",
)({
  tenantId: Schema.String,
  clientId: Schema.String,
}) {}

export class CloudAccessTarget extends Schema.Class<CloudAccessTarget>(
  "CloudAccessTarget",
)({
  id: CloudAccessTargetId,
  projectId: ProjectId,
  provider: CloudProvider,
  audience: Schema.String,
  tokenFile: Schema.optionalKey(Schema.String),
  subject: Schema.String,
  gcp: Schema.NullOr(CloudAccessGcp),
  aws: Schema.NullOr(CloudAccessAws),
  vault: Schema.NullOr(CloudAccessVault),
  azure: Schema.NullOr(CloudAccessAzure),
  lastCheck: Schema.NullOr(CloudAccessCheck),
  createdByUserId: Schema.NullOr(UserId),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class CloudAccess extends Schema.Class<CloudAccess>("CloudAccess")({
  issuer: Schema.String,
  discoveryUrl: Schema.String,
  jwksUrl: Schema.String,
  targets: Schema.Array(CloudAccessTarget),
}) {}

export const CloudAccessGcpRequest = Schema.Struct({
  projectNumber: GcpProjectNumber,
  serviceAccountEmail: GcpServiceAccountEmail,
}).annotate({ identifier: "CloudAccessGcpRequest" });

export const CloudAccessAwsRequest = Schema.Struct({
  roleArn: AwsRoleArn,
  region: Schema.NullOr(AwsRegion),
  audience: CloudAudience,
}).annotate({ identifier: "CloudAccessAwsRequest" });

export const CloudAccessVaultRequest = Schema.Struct({
  address: VaultAddress,
  role: VaultRole,
  authMount: VaultPath,
  namespace: Schema.NullOr(VaultPath),
  audience: CloudAudience,
}).annotate({ identifier: "CloudAccessVaultRequest" });

export const CloudAccessAzureRequest = Schema.Struct({
  tenantId: AzureId,
  clientId: AzureId,
}).annotate({ identifier: "CloudAccessAzureRequest" });

export const CreateCloudAccessTargetRequest = Schema.Union([
  Schema.Struct({
    projectId: ProjectId,
    provider: Schema.Literal("gcp"),
    gcp: CloudAccessGcpRequest,
  }),
  Schema.Struct({
    projectId: ProjectId,
    provider: Schema.Literal("oidc"),
    audience: CloudAudience,
  }),
  Schema.Struct({
    projectId: ProjectId,
    provider: Schema.Literal("aws"),
    aws: CloudAccessAwsRequest,
  }),
  Schema.Struct({
    projectId: ProjectId,
    provider: Schema.Literal("vault"),
    vault: CloudAccessVaultRequest,
  }),
  Schema.Struct({
    projectId: ProjectId,
    provider: Schema.Literal("azure"),
    azure: CloudAccessAzureRequest,
  }),
]).annotate({ identifier: "CreateCloudAccessTargetRequest" });
export type CreateCloudAccessTargetRequest =
  typeof CreateCloudAccessTargetRequest.Type;

export const UpdateCloudAccessTargetRequest = Schema.Union([
  Schema.Struct({ gcp: CloudAccessGcpRequest }),
  Schema.Struct({ audience: CloudAudience }),
  Schema.Struct({ aws: CloudAccessAwsRequest }),
  Schema.Struct({ vault: CloudAccessVaultRequest }),
  Schema.Struct({ azure: CloudAccessAzureRequest }),
]).annotate({ identifier: "UpdateCloudAccessTargetRequest" });
export type UpdateCloudAccessTargetRequest =
  typeof UpdateCloudAccessTargetRequest.Type;
