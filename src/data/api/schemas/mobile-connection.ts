import { Schema } from "effect";
import { Timestamp } from "./ids.ts";

export class MobileConnectionApproval extends Schema.Class<MobileConnectionApproval>(
  "MobileConnectionApproval",
)({
  userCode: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(Timestamp),
  url: Schema.NullOr(Schema.String),
}) {}

export class MobileConnection extends Schema.Class<MobileConnection>(
  "MobileConnection",
)({
  configured: Schema.Boolean,
  accessGranted: Schema.Boolean,
  available: Schema.Boolean,
  disabledAt: Schema.NullOr(Timestamp),
  state: Schema.NullOr(Schema.String),
  connectedAt: Schema.NullOr(Timestamp),
  revylOrgName: Schema.NullOr(Schema.String),
  billedBy: Schema.NullOr(Schema.String),
  ownerName: Schema.NullOr(Schema.String),
  approval: Schema.NullOr(MobileConnectionApproval),
  approvalOutcome: Schema.NullOr(Schema.String),
  supportReference: Schema.NullOr(Schema.String),
}) {}
