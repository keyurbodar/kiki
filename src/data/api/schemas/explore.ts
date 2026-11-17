import { Schema } from "effect";
import { Timestamp } from "./ids.ts";

export const ListingKind = Schema.Literals(["plugin", "skill", "theme"]);
export type ListingKind = typeof ListingKind.Type;

export const listingKinds: ReadonlyArray<ListingKind> = [
  "plugin",
  "skill",
  "theme",
];

export const ListingSource = Schema.Literals([
  "catalog",
  "user",
  "sync",
  "admin",
]);
export type ListingSource = typeof ListingSource.Type;

export const PluginCategory = Schema.Literals([
  "monitoring",
  "deployment",
  "database",
  "docs",
  "design",
  "payments",
  "productivity",
  "other",
]);
export type PluginCategory = typeof PluginCategory.Type;

export const pluginCategories: ReadonlyArray<PluginCategory> = [
  "monitoring",
  "deployment",
  "database",
  "docs",
  "design",
  "payments",
  "productivity",
  "other",
];

export const ListingMaker = Schema.Struct({
  name: Schema.String,
  url: Schema.optional(Schema.String),
});

export const ThemePalette = Schema.Record(Schema.String, Schema.String);

export const ExploreTheme = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  light: ThemePalette,
  dark: ThemePalette,
  wallpaper: Schema.optional(Schema.Struct({ name: Schema.String })),
  appearance: Schema.optional(Schema.Unknown),
});
export type ExploreTheme = typeof ExploreTheme.Type;

export class ExploreCard extends Schema.Class<ExploreCard>("ExploreCard")({
  kind: ListingKind,
  source: ListingSource,
  slug: Schema.String,
  displayName: Schema.String,
  description: Schema.String,
  maker: Schema.NullOr(ListingMaker),
  accent: Schema.NullOr(Schema.String),
  category: Schema.NullOr(PluginCategory),
  firstListedAt: Schema.NullOr(Timestamp),
  featuredRank: Schema.NullOr(Schema.Number),
  hasIcon: Schema.Boolean,
  repository: Schema.NullOr(Schema.String),
  stars: Schema.NullOr(Schema.Number),
  starsCheckedAt: Schema.NullOr(Timestamp),
  adds: Schema.NullOr(Schema.Number),
  version: Schema.NullOr(Schema.String),
  versionId: Schema.NullOr(Schema.String),
  theme: Schema.NullOr(ExploreTheme),
  builtIn: Schema.NullOr(Schema.Struct({ settingsPath: Schema.String })),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}) {}

export class ExploreIndex extends Schema.Class<ExploreIndex>("ExploreIndex")({
  cards: Schema.Array(ExploreCard),
  added: Schema.Array(Schema.String),
  updates: Schema.optional(Schema.Array(Schema.String)),
}) {}

export const ExploreListingsQuery = Schema.Struct({
  kind: Schema.optional(ListingKind),
  q: Schema.optional(Schema.String.check(Schema.isMaxLength(200))),
}).annotate({ identifier: "ExploreListingsQuery" });
