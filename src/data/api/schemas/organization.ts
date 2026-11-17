import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import { OrgId, ProjectId, Timestamp } from "./ids.ts";

export const AccessLevel = Schema.Literals(["member", "admin", "owner"]);
export type AccessLevel = typeof AccessLevel.Type;

export const Visibility = Schema.Literals(["org", "private"]);
export type Visibility = typeof Visibility.Type;

export const TitleTrigger = Schema.Literals(["pull_opened", "first_run_ended"]);

export const ModelSelection = Schema.Struct({
  modelId: Schema.String,
  reasoningMode: Schema.optional(Schema.String),
  modes: Schema.optional(Schema.Record(Schema.String, Schema.Boolean)),
});

export class Organization extends Schema.Class<Organization>("Organization")({
  id: OrgId,
  name: Schema.String,
  avatarUrl: Schema.NullOr(Schema.String),
  accessLevel: AccessLevel,
  defaultProjectId: Schema.NullOr(ProjectId),
  titlePrompt: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  orgTitlePrompt: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  titleTriggers: Schema.NullOr(Schema.Array(TitleTrigger)).pipe(
    withDefault(null),
  ),
  orgTitleTriggers: Schema.NullOr(Schema.Array(TitleTrigger)).pipe(
    withDefault(null),
  ),
  defaultModel: Schema.NullOr(ModelSelection).pipe(withDefault(null)),
  taskConcurrentLimit: Schema.NullOr(Schema.Int).pipe(withDefault(null)),
  taskNestedDepth: Schema.NullOr(Schema.Int).pipe(withDefault(null)),
  entitlements: Schema.Array(Schema.String),
  planUnread: Schema.Boolean.pipe(withDefault(false)),
  experiments: Schema.Array(Schema.Unknown).pipe(withDefault([])),
  personalThreadsEnabled: Schema.Boolean.pipe(withDefault(true)),
  pullGuidesEnabled: Schema.Boolean.pipe(withDefault(true)),
  mfaRequired: Schema.Boolean.pipe(withDefault(false)),
  mfaEnforceAt: Schema.NullOr(Timestamp).pipe(withDefault(null)),
  mfaLevel: Schema.Literals(["any", "passkey"]).pipe(withDefault("any")),
  viewerMfaProtected: Schema.Boolean.pipe(withDefault(true)),
  viewerMfaExtendedUntil: Schema.NullOr(Timestamp).pipe(withDefault(null)),
  defaultVisibility: Visibility.pipe(withDefault("org")),
  viewerDefaultVisibility: Schema.NullOr(Visibility).pipe(withDefault(null)),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  purgesAt: Schema.optional(Timestamp),
}) {}
