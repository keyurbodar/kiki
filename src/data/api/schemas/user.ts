import { Schema } from "effect";
import { Timestamp, UserId } from "./ids.ts";

export class UserProfile extends Schema.Class<UserProfile>("UserProfile")({
  id: UserId,
  email: Schema.NullOr(Schema.String),
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  imageUrl: Schema.NullOr(Schema.String),
  superadmin: Schema.Boolean,
  preferences: Schema.Record(Schema.String, Schema.Unknown),
  clientAppearance: Schema.optional(
    Schema.Record(Schema.String, Schema.Unknown),
  ),
  onboardedAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}
