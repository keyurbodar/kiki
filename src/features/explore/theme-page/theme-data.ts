import { DateTime } from "effect";
import type { ExploreListing } from "@/data/api/schemas/explore";
import type {
  ExploreTheme,
  ThemeCardPreview,
  ThemeEffect,
  ThemeListing,
} from "../theme-detail";
import { DEFAULT_THEME_EFFECT } from "../theme-detail/format";

const THEME_EFFECTS: ReadonlyArray<ThemeEffect> = [
  "none",
  "dither",
  "grain",
  "vignette",
];

const isPalette = (value: unknown): value is Readonly<Record<string, string>> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

const wallpaperName = (value: unknown): string | undefined =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { name?: unknown }).name === "string"
    ? (value as { name: string }).name
    : undefined;

const themeEffect = (value: unknown): ThemeEffect | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const effect = (value as { effect?: unknown }).effect;
  return (
    THEME_EFFECTS.find((candidate) => candidate === effect) ??
    DEFAULT_THEME_EFFECT
  );
};

export function readTheme(value: unknown): ExploreTheme | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (!isPalette(record.light) || !isPalette(record.dark)) return undefined;
  const name = wallpaperName(record.wallpaper);
  const effect = themeEffect(record.appearance);
  return {
    light: record.light,
    dark: record.dark,
    ...(name === undefined ? {} : { wallpaper: { name } }),
    ...(effect === undefined ? {} : { appearance: { effect } }),
  };
}

const preview = (theme: ExploreTheme): ThemeCardPreview => ({
  light: theme.light,
  dark: theme.dark,
  ...(theme.wallpaper === undefined ? {} : { wallpaper: theme.wallpaper }),
});

export type ThemeDetailData = {
  readonly listing: ThemeListing;
  readonly theme: ExploreTheme;
};

export function themeDetail(
  listing: ExploreListing,
): ThemeDetailData | undefined {
  const theme = readTheme(
    listing.content.kind === "theme"
      ? listing.content.theme
      : listing.card.theme,
  );
  if (theme === undefined) return undefined;
  const { card } = listing;
  return {
    theme,
    listing: {
      card: {
        kind: card.kind,
        slug: card.slug,
        versionId: card.versionId,
        displayName: card.displayName,
        description: card.description,
        source: card.source === "user" ? "user" : "capy",
        builtIn: card.builtIn,
        maker: card.maker,
        adds: card.adds,
        version: card.version,
        updatedAt: DateTime.toDate(card.updatedAt),
        featuredRank: card.featuredRank,
        theme: preview(theme),
      },
      versions: listing.versions.map((version) => ({
        id: version.id,
        createdAt: DateTime.toDate(version.createdAt),
      })),
    },
  };
}
