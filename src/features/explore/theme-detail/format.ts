import type {
  ExploreTheme,
  ListingDate,
  ListingKind,
  ThemeEffect,
  ThemeListing,
  ThemeListingCard,
} from "./types";

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const DEFAULT_THEME_EFFECT: ThemeEffect = "dither";

export const THEME_EFFECT_LABELS: Record<ThemeEffect, string> = {
  none: "None",
  dither: "Dither",
  grain: "Grain",
  vignette: "Vignette",
};

export const LISTING_KIND_PATHS: Record<ListingKind, string> = {
  plugin: "plugins",
  skill: "skills",
  theme: "themes",
};

export const formatCount = (count: number) =>
  compactNumber.format(count).toLowerCase();

export const formatShortDate = (date: ListingDate) => shortDate.format(date);

export const formatVersion = (version: string) =>
  /^[0-9a-f]{40}$/.test(version) ? version.slice(0, 7) : version;

export const trimDescription = (description: string) =>
  description.replace(/\.$/, "");

export const makerName = (
  card: Pick<ThemeListingCard, "builtIn" | "maker" | "kind">,
) => {
  if (card.builtIn !== null) return "Built in";
  if (card.maker !== null) return card.maker.name;
  return card.kind === "theme" ? "Capy" : undefined;
};

export const listingParams = (
  card: Pick<ThemeListingCard, "kind" | "slug">,
) => ({
  kind: LISTING_KIND_PATHS[card.kind],
  slug: card.slug,
});

export type ThemeFact = readonly [label: string, value: string];

export function themeFacts(
  listing: ThemeListing,
  theme: ExploreTheme,
): ThemeFact[] {
  const { card } = listing;
  const latest = listing.versions[0];
  const facts: ThemeFact[] = [["Made by", makerName(card) ?? "Capy"]];
  if (card.adds !== null)
    facts.push([
      "Added",
      card.adds === 1 ? "Once" : `${formatCount(card.adds)} times`,
    ]);
  if (theme.wallpaper !== undefined)
    facts.push(["Wallpaper", theme.wallpaper.name]);
  if (theme.appearance !== undefined)
    facts.push([
      "Effect",
      THEME_EFFECT_LABELS[theme.appearance.effect ?? DEFAULT_THEME_EFFECT],
    ]);
  if (card.version !== null)
    facts.push([
      "Version",
      `${formatVersion(card.version)}, ${formatShortDate(latest?.createdAt ?? card.updatedAt)}`,
    ]);
  return facts;
}

export const lightDarkCaption = (theme: ExploreTheme) =>
  theme.appearance === undefined
    ? "Adding it applies these colors"
    : "Adding it applies these colors with the wallpaper and effect";
