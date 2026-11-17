import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import { OrgId, Timestamp, UserId } from "./ids.ts";
import { AccessLevel } from "./organization.ts";

export const NonOwnerAccessLevel = Schema.Literals(["member", "admin"]);
export type NonOwnerAccessLevel = typeof NonOwnerAccessLevel.Type;

export class OrganizationMember extends Schema.Class<OrganizationMember>(
  "OrganizationMember",
)({
  userId: UserId,
  email: Schema.NullOr(Schema.String),
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  imageUrl: Schema.NullOr(Schema.String),
  accessLevel: AccessLevel,
  disabled: Schema.Boolean,
  createdAt: Timestamp,
  githubLogin: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  mfaEnabled: Schema.Boolean.pipe(withDefault(false)),
  enterpriseSso: Schema.Boolean.pipe(withDefault(false)),
  passkeyTrusted: Schema.Boolean.pipe(withDefault(false)),
  mfaExtendedUntil: Schema.NullOr(Timestamp).pipe(withDefault(null)),
}) {}

export class Invitation extends Schema.Class<Invitation>("Invitation")({
  id: Schema.String,
  email: Schema.String,
  invitedByUserId: UserId,
  expiresAt: Timestamp,
  createdAt: Timestamp,
}) {}

export class MyInvitation extends Schema.Class<MyInvitation>("MyInvitation")({
  id: Schema.String,
  orgId: OrgId,
  orgName: Schema.String,
  orgAvatarUrl: Schema.NullOr(Schema.String),
  inviterName: Schema.String,
  projectCount: Schema.Int,
  invitedAt: Timestamp,
}) {}

export class JoinableOrganization extends Schema.Class<JoinableOrganization>(
  "JoinableOrganization",
)({
  orgId: OrgId,
  orgName: Schema.String,
  orgAvatarUrl: Schema.NullOr(Schema.String),
  projectCount: Schema.Int,
}) {}

export const InviteMembersRequest = Schema.Struct({
  emails: Schema.Array(Schema.String),
}).annotate({ identifier: "InviteMembersRequest" });

export class InviteOutcome extends Schema.Class<InviteOutcome>("InviteOutcome")(
  {
    email: Schema.String,
    status: Schema.Literals(["invited", "already_member", "invalid"]),
    invitation: Schema.NullOr(Invitation),
  },
) {}

export const SetMemberRoleRequest = Schema.Struct({
  accessLevel: NonOwnerAccessLevel,
}).annotate({ identifier: "SetMemberRoleRequest" });

export const RestoreMemberRequest = Schema.Struct({
  accessLevel: AccessLevel,
}).annotate({ identifier: "RestoreMemberRequest" });

export const RevokeOwnerRequest = Schema.Struct({
  accessLevel: NonOwnerAccessLevel,
}).annotate({ identifier: "RevokeOwnerRequest" });

export const SetMfaExtensionRequest = Schema.Struct({
  until: Timestamp,
}).annotate({ identifier: "SetMfaExtensionRequest" });
