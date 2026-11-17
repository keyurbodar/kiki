import { Schema } from "effect";
import { Forbidden } from "./errors.ts";
import { OrgId, ProjectId, ServiceUserId, Timestamp, UserId } from "./ids.ts";
import { ModelSelection } from "./organization.ts";
import { ProjectIcon } from "./project.ts";

export const ApiKeyId = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
).pipe(Schema.brand("Core.ApiKeyId"));
export type ApiKeyId = typeof ApiKeyId.Type;

export const PrincipalKind = Schema.Literals(["human", "service"]);
export type PrincipalKind = typeof PrincipalKind.Type;

export const ServiceUserRole = Schema.Literals([
  "read_only",
  "read_write",
  "admin",
]);
export type ServiceUserRole = typeof ServiceUserRole.Type;

export const ProjectAccessMode = Schema.Literals([
  "all_org_projects",
  "allowlist",
]);
export type ProjectAccessMode = typeof ProjectAccessMode.Type;

/** Capy decodes unknown members to "unsupported"; kept as a plain string here. */
export const SubscriptionService = Schema.String;

export class ApiKeyPrivateProject extends Schema.Class<ApiKeyPrivateProject>(
  "ApiKeyPrivateProject",
)({
  projectId: ProjectId,
  carried: Schema.Boolean,
}) {}

export class ApiKey extends Schema.Class<ApiKey>("ApiKey")({
  id: ApiKeyId,
  name: Schema.String,
  tokenHint: Schema.NullOr(Schema.String),
  principalKind: PrincipalKind,
  principalUserId: Schema.Union([UserId, ServiceUserId]),
  expiresAt: Schema.NullOr(Timestamp),
  revokedAt: Schema.NullOr(Timestamp),
  createdByUserId: UserId,
  createdAt: Timestamp,
  privateProjects: Schema.Array(ApiKeyPrivateProject),
}) {}

export class MintedApiKey extends Schema.Class<MintedApiKey>("MintedApiKey")({
  key: ApiKey,
  plaintext: Schema.String,
}) {}

export const MintApiKeyRequest = Schema.Struct({
  name: Schema.String,
  serviceUserId: Schema.optional(ServiceUserId),
  expiresAt: Schema.optional(Timestamp),
}).annotate({ identifier: "MintApiKeyRequest" });

export const RenameApiKeyRequest = Schema.Struct({
  name: Schema.String,
}).annotate({ identifier: "RenameApiKeyRequest" });

const serviceUserFields = {
  id: ServiceUserId,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  icon: Schema.NullOr(ProjectIcon),
  role: ServiceUserRole,
  projectAccessMode: ProjectAccessMode,
  model: Schema.NullOr(ModelSelection),
  monthlySpendCapCredits: Schema.NullOr(Schema.Number),
  subscriptionOwnerUserId: Schema.NullOr(UserId),
  createdByUserId: UserId,
  disabledAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp,
};

export class ServiceUser extends Schema.Class<ServiceUser>("ServiceUser")(
  serviceUserFields,
) {}

export class ServiceUserDetail extends Schema.Class<ServiceUserDetail>(
  "ServiceUserDetail",
)({
  ...serviceUserFields,
  projectIds: Schema.Array(ProjectId),
  subscriptionServices: Schema.Array(SubscriptionService),
}) {}

export const CreateServiceUserRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
  icon: Schema.optional(Schema.NullOr(ProjectIcon)),
  role: ServiceUserRole,
}).annotate({ identifier: "CreateServiceUserRequest" });

export const UpdateServiceUserRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  icon: Schema.optional(Schema.NullOr(ProjectIcon)),
  role: Schema.optional(ServiceUserRole),
  model: Schema.optional(Schema.NullOr(ModelSelection)),
  monthlySpendCapCredits: Schema.optional(Schema.NullOr(Schema.Number)),
}).annotate({ identifier: "UpdateServiceUserRequest" });

export const ReplaceServiceUserProjectsRequest = Schema.Struct({
  projectAccessMode: ProjectAccessMode,
  projectIds: Schema.Array(ProjectId),
}).annotate({ identifier: "ReplaceServiceUserProjectsRequest" });

export const SetServiceUserSubscriptionRequest = Schema.Struct({
  ownerUserId: Schema.NullOr(UserId),
}).annotate({ identifier: "SetServiceUserSubscriptionRequest" });

export class InvalidRequest extends Schema.TaggedError<InvalidRequest>()(
  "capy/InvalidRequest",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class ApiKeyNotFound extends Schema.TaggedError<ApiKeyNotFound>()(
  "capy/ApiKeyNotFound",
  { keyId: ApiKeyId },
  { httpApiStatus: 404 },
) {}

export class ServiceUserNotFound extends Schema.TaggedError<ServiceUserNotFound>()(
  "capy/ServiceUserNotFound",
  { serviceUserId: ServiceUserId },
  { httpApiStatus: 404 },
) {}

export { Forbidden, OrgId };
