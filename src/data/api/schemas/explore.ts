import { Schema } from "effect";
import { HttpApiSchema } from "effect/http-api";
import { Timestamp } from "./ids.ts";

/**
 * Capy answers a listing's image endpoint with the bytes themselves under
 * `application/octet-stream`, not JSON: the theme wallpaper, the listing icon.
 */
export const ImageBytes = Schema.Uint8Array.pipe(
  HttpApiSchema.asUint8Array({ contentType: "application/octet-stream" }),
).annotate({ identifier: "ImageBytes" });
export type ImageBytes = typeof ImageBytes.Type;

export const ListingKind = Schema.Literals(["plugin", "skill", "theme"]);
export type ListingKind = typeof ListingKind.Type;

export const ListingSource = Schema.Literals([
  "catalog",
  "user",
  "sync",
  "admin",
]);
export type ListingSource = typeof ListingSource.Type;

export const ListingSlug = Schema.String.check(
  Schema.isPattern(/^[a-z0-9](?:[a-z0-9-]{0,94}[a-z0-9])?$/u),
);

export const ListingCategory = Schema.Literals([
  "monitoring",
  "deployment",
  "database",
  "docs",
  "design",
  "payments",
  "productivity",
  "other",
]);
export type ListingCategory = typeof ListingCategory.Type;

export const ListingMaker = Schema.Struct({
  name: Schema.String,
  url: Schema.optional(Schema.String),
});
export type ListingMaker = typeof ListingMaker.Type;

export class ExploreNotFound extends Schema.TaggedError<ExploreNotFound>()(
  "capy/ExploreNotFound",
  { kind: Schema.String, slug: Schema.String },
  { httpApiStatus: 404 },
) {}

export class ExploreRateLimited extends Schema.TaggedError<ExploreRateLimited>()(
  "capy/ExploreRateLimited",
  {},
  { httpApiStatus: 429 },
) {}

export class ExploreCard extends Schema.Class<ExploreCard>("ExploreCard")({
  kind: ListingKind,
  source: ListingSource,
  slug: ListingSlug,
  displayName: Schema.String,
  description: Schema.String,
  maker: Schema.NullOr(ListingMaker),
  accent: Schema.NullOr(Schema.String),
  category: Schema.NullOr(ListingCategory),
  firstListedAt: Schema.NullOr(Timestamp),
  featuredRank: Schema.NullOr(Schema.Number),
  /** Position in the Popular section, which is a server-side ordering: the grid draws these first, ascending. */
  popularRank: Schema.NullOr(Schema.Number),
  hasIcon: Schema.Boolean,
  repository: Schema.NullOr(Schema.String),
  stars: Schema.NullOr(Schema.Number),
  starsCheckedAt: Schema.NullOr(Timestamp),
  adds: Schema.NullOr(Schema.Number),
  version: Schema.NullOr(Schema.String),
  versionId: Schema.NullOr(Schema.String),
  theme: Schema.NullOr(Schema.Unknown),
  builtIn: Schema.NullOr(Schema.Struct({ settingsPath: Schema.String })),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class ExploreIndex extends Schema.Class<ExploreIndex>("ExploreIndex")({
  cards: Schema.Array(ExploreCard),
  added: Schema.Array(Schema.String),
  updates: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class ExploreVersion extends Schema.Class<ExploreVersion>(
  "ExploreVersion",
)({
  id: Schema.String,
  version: Schema.String,
  notes: Schema.NullOr(Schema.String),
  createdAt: Timestamp,
}) {}

export const ExplorePluginServer = Schema.Struct({
  displayName: Schema.String,
  transport: Schema.Literals(["http", "sse", "stdio"]),
  placement: Schema.Literals(["backend", "machine"]),
  url: Schema.NullOr(Schema.String),
  command: Schema.NullOr(Schema.String),
  auth: Schema.Literals(["oauth", "headers", "none"]),
  connection: Schema.Literals(["member", "organization"]),
  scopes: Schema.Array(Schema.String),
  secrets: Schema.Array(Schema.String),
});
export type ExplorePluginServer = typeof ExplorePluginServer.Type;

export const ExplorePluginContent = Schema.Struct({
  servers: Schema.Array(ExplorePluginServer),
  skills: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      description: Schema.String,
      content: Schema.NullOr(Schema.String),
    }),
  ),
  repository: Schema.NullOr(Schema.String),
  path: Schema.String,
  commit: Schema.String,
  license: Schema.NullOr(Schema.String),
  warnings: Schema.Array(Schema.String),
  prerequisites: Schema.NullOr(Schema.String),
});
export type ExplorePluginContent = typeof ExplorePluginContent.Type;

export const ListingAutomation = Schema.Struct({
  name: Schema.String,
  purpose: Schema.String,
  trigger: Schema.Unknown,
  prompt: Schema.String,
});
export type ListingAutomation = typeof ListingAutomation.Type;

export const ListingSetup = Schema.Struct({
  prompt: Schema.String,
  automations: Schema.Array(ListingAutomation),
  starters: Schema.optional(Schema.Array(Schema.String)),
  inputs: Schema.optional(Schema.Array(Schema.Unknown)),
});
export type ListingSetup = typeof ListingSetup.Type;

export const ListingFile = Schema.Struct({
  path: Schema.String,
  content: Schema.String,
});
export type ListingFile = typeof ListingFile.Type;

export const ExploreSkill = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  files: Schema.Array(ListingFile),
  starters: Schema.Array(Schema.String),
  source: Schema.Struct({
    repository: Schema.String,
    path: Schema.String,
    commit: Schema.String,
  }),
  maker: Schema.optional(ListingMaker),
  setup: Schema.optional(ListingSetup),
});
export type ExploreSkill = typeof ExploreSkill.Type;

export const ExploreContent = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("plugin"),
    plugin: ExplorePluginContent,
  }),
  Schema.Struct({ kind: Schema.Literal("builtIn") }),
  Schema.Struct({ kind: Schema.Literal("skill"), skill: ExploreSkill }),
  Schema.Struct({ kind: Schema.Literal("theme"), theme: Schema.Unknown }),
]);
export type ExploreContent = typeof ExploreContent.Type;

export class ExploreListing extends Schema.Class<ExploreListing>(
  "ExploreListing",
)({
  card: ExploreCard,
  content: ExploreContent,
  setup: Schema.NullOr(ListingSetup),
  versions: Schema.Array(ExploreVersion),
}) {}

export const ReportReason = Schema.Literals([
  "broken",
  "unsafe",
  "misleading",
  "outdated",
  "other",
]);
export type ReportReason = typeof ReportReason.Type;

export const reportTextMaxLength = 2000;

export const ReportListingRequest = Schema.Struct({
  kind: ListingKind,
  slug: Schema.String,
  reason: ReportReason,
  text: Schema.optional(
    Schema.String.check(Schema.isMaxLength(reportTextMaxLength)),
  ),
});
export type ReportListingRequest = typeof ReportListingRequest.Type;

export const SkillScope = Schema.Union([
  Schema.Struct({ projectId: Schema.String }),
  Schema.Struct({ userId: Schema.String }),
  Schema.Struct({}),
]);
export type SkillScope = typeof SkillScope.Type;

export const AddSkillRequest = Schema.Struct({
  slug: Schema.String,
  scope: SkillScope,
});
export type AddSkillRequest = typeof AddSkillRequest.Type;

export class AddSkillResult extends Schema.Class<AddSkillResult>(
  "AddSkillResult",
)({
  name: Schema.String,
  versionId: Schema.NullOr(Schema.String),
  replaced: Schema.Boolean,
}) {}

export const listingKey = (card: { kind: ListingKind; slug: string }) =>
  `${card.kind}:${card.slug}`;
