import type { ReactNode } from "react";

export type ThemePalette = Readonly<Record<string, string>>;

export type ThemeEffect = "none" | "dither" | "grain" | "vignette";

export type ThemeWallpaper = { readonly name: string };

export type ThemeAppearance = { readonly effect?: ThemeEffect };

export type ExploreTheme = {
  readonly light: ThemePalette;
  readonly dark: ThemePalette;
  readonly wallpaper?: ThemeWallpaper;
  readonly appearance?: ThemeAppearance;
};

export type ListingKind = "plugin" | "skill" | "theme";

export type ListingMaker = { readonly name: string };

export type ThemeCardPreview = {
  readonly light: ThemePalette;
  readonly dark: ThemePalette;
  readonly wallpaper?: ThemeWallpaper;
};

export type ListingDate = Date | number;

export type ThemeListingCard = {
  readonly kind: ListingKind;
  readonly slug: string;
  readonly versionId: string | null;
  readonly displayName: string;
  readonly description: string;
  readonly source: "capy" | "user";
  readonly builtIn: unknown;
  readonly maker: ListingMaker | null;
  readonly adds: number | null;
  readonly version: string | null;
  readonly updatedAt: ListingDate;
  readonly featuredRank: number | null;
  readonly theme: ThemeCardPreview | null;
};

export type ListingVersion = {
  readonly id: string;
  readonly createdAt: ListingDate;
};

export type ThemeListing = {
  readonly card: ThemeListingCard;
  readonly versions: ReadonlyArray<ListingVersion>;
};

export type ExploreCrumb = { readonly label: string; readonly to?: string };

export type ThemeDetailSlots = {
  readonly header?: ReactNode;
  readonly addAction?: ReactNode;
  readonly signInToAdd?: ReactNode;
  readonly report?: ReactNode;
};
