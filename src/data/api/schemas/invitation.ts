import { Schema } from "effect";
import { OrgId, Timestamp } from "./ids.ts";

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
