import { isoMinutesAgo, people, presetThemeIds } from "../fixtures/world.ts";

/**
 * Capy's user themes carry a light and a dark palette of literal, reference or
 * mix colours (the Appearance editor reads and writes these). These three are
 * the themes the captured account added from Explore, with the values their
 * detail pages render.
 */
const literal = (hex: string) => ({ kind: "literal", hex }) as const;
const palette = (
  background: string,
  foreground: string,
  accent: string,
  accentText: string,
  shaderInk = accent,
) => ({
  background: literal(background),
  foreground: literal(foreground),
  text: literal(foreground),
  accent: literal(accent),
  accentText: literal(accentText),
  shaderInk: literal(shaderInk),
});

export const sampleThemes = [
  {
    id: "theme_sample_classic",
    name: "Classic",
    slug: "classic",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "green" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#f2f2f4", "#1e1e20", "#3b5de8", "#ffffff", "#778abd"),
    dark: palette("#09090a", "#ebebec", "#21a388", "#ffffff", "#566a9e"),
    effect: "grain",
    background: null,
    listingVersionId: "thv_sample_classic_1",
    published: false,
    version: 1,
    createdAt: isoMinutesAgo(19 * 24 * 60),
    updatedAt: isoMinutesAgo(19 * 24 * 60),
  },
  {
    id: "theme_sample_evernight_rain",
    name: "Evernight Rain",
    slug: "evernight-rain",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "rose" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#f4ebed", "#2a1e22", "#aa194f", "#fff7f8", "#aa194f"),
    dark: {
      ...palette("#000000", "#ede3e6", "#e27284", "#270c11", "#e27284"),
      chrome: literal("#000000"),
      panel: literal("#0c0709"),
      card: literal("#170d12"),
      cardHover: literal("#1e1318"),
      popover: literal("#24161d"),
      input: { kind: "reference", field: "card" } as const,
      button: literal("#1e1318"),
      buttonHover: literal("#26191f"),
      muted: literal("#442f38"),
      mutedForeground1: literal("#a2989c"),
      mutedForeground2: literal("#7b7074"),
      mutedForeground3: literal("#5a5154"),
      iconMuted: literal("#5f5659"),
    },
    effect: "dither",
    background: null,
    listingVersionId: "thv_sample_evernight_rain_1",
    published: false,
    version: 1,
    createdAt: isoMinutesAgo(18 * 24 * 60),
    updatedAt: isoMinutesAgo(18 * 24 * 60),
  },
  {
    id: "theme_sample_kiki",
    name: "Kiki",
    slug: "kiki",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "green" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#efeff0", "#1b1b1d", "#d97b00", "#170d00", "#d97b00"),
    dark: {
      ...palette("#000000", "#ffffff", "#58c24c", "#000000", "#58c24c"),
      chrome: literal("#000000"),
    },
    effect: "dither",
    background: null,
    listingVersionId: "thv_sample_kiki_1",
    published: false,
    version: 1,
    createdAt: isoMinutesAgo(17 * 24 * 60),
    updatedAt: isoMinutesAgo(17 * 24 * 60),
  },
] as const;

export const samplePublications = [] as const;

export const presetIds = presetThemeIds;
