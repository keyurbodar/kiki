import { Schema } from "effect";
import {
  type ListingCategory,
  ListingCategory as ListingCategorySchema,
} from "@/data/api/schemas/explore.ts";

const listingCategories = Schema.is(ListingCategorySchema);

export type ExploreKind = "plugin" | "skill" | "theme";

export const exploreKinds: ReadonlyArray<ExploreKind> = [
  "plugin",
  "skill",
  "theme",
];

export const exploreLabels: Record<ExploreKind, string> = {
  plugin: "Plugins",
  skill: "Skills",
  theme: "Themes",
};

export const exploreDescriptions: Record<ExploreKind, string> = {
  plugin: "Extend what Capy can do with your tools",
  skill: "Instructions the agent follows, from GitHub, ranked by stars",
  theme: "Palettes for light and dark, some with a wallpaper",
};

export const explorePaths: Record<ExploreKind, string> = {
  plugin: "plugins",
  skill: "skills",
  theme: "themes",
};

export type ExploreTab = Exclude<ExploreKind, "plugin">;
export type ExploreSection = "featured" | "recent";

export type ExploreSearch = {
  tab?: ExploreTab;
  q?: string;
  section?: ExploreSection;
  category?: ListingCategory;
  page?: number;
};

const isTab = (value: unknown): value is ExploreTab =>
  value === "skill" || value === "theme";

const isSection = (value: unknown): value is ExploreSection =>
  value === "featured" || value === "recent";

const isCategory = (value: unknown): value is ListingCategory =>
  listingCategories(value);

export function exploreKindFromPath(path: string): ExploreKind | undefined {
  return exploreKinds.find((kind) => explorePaths[kind] === path);
}

export const exploreKindOf = (search: ExploreSearch): ExploreKind =>
  search.tab ?? "plugin";

/** Search params for /explore and /explore/$kind, matching Capy's validator. */
export function parseExploreSearch(
  search: Record<string, unknown>,
): ExploreSearch {
  const q = search.q;
  const page = search.page;
  const parsed: ExploreSearch = {};
  if (isTab(search.tab)) parsed.tab = search.tab;
  if (typeof q === "string" && q !== "") parsed.q = q.slice(0, 200);
  if (isSection(search.section)) parsed.section = search.section;
  if (isCategory(search.category)) parsed.category = search.category;
  if (typeof page === "number" && Number.isSafeInteger(page) && page > 1)
    parsed.page = Math.min(page, 100_000);
  return parsed;
}

export const exploreSearchFor = (
  search: ExploreSearch,
  kind: ExploreKind,
): ExploreSearch => ({
  ...search,
  tab: kind === "plugin" ? undefined : kind,
});

export const exploreLabelFor = (kind: ExploreKind) =>
  exploreLabels[kind].toLowerCase();
