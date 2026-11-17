import { isoMinutesAgo, people, presetThemeIds } from "../fixtures/world.ts";

/**
 * Capy's user themes carry a light and a dark palette of literal, reference or
 * mix colours (the Appearance editor reads and writes these). Neutral values.
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
    id: "theme_sample_aurora",
    name: "Aurora",
    slug: "aurora",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "green" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#f2f2f4", "#1e1e20", "#3b5de8", "#ffffff", "#778abd"),
    dark: palette("#09090a", "#ebebec", "#21a388", "#ffffff", "#566a9e"),
    effect: "dither",
    background: null,
    listingVersionId: null,
    published: true,
    version: 2,
    createdAt: isoMinutesAgo(20 * 24 * 60),
    updatedAt: isoMinutesAgo(3 * 24 * 60),
  },
  {
    id: "theme_sample_paper",
    name: "Paper",
    slug: "paper",
    ownerId: people.sam.id,
    colors: { background: "light", foreground: "dark", accent: "rose" },
    fontFamily: "Georgia",
    fontSize: 15,
    light: palette("#f4ebed", "#2a1e22", "#aa194f", "#fff7f8", "#aa194f"),
    dark: palette("#000000", "#ede3e6", "#e27284", "#270c11", "#e27284"),
    effect: "grain",
    background: null,
    listingVersionId: null,
    published: false,
    version: 1,
    createdAt: isoMinutesAgo(12 * 24 * 60),
    updatedAt: isoMinutesAgo(2 * 60),
  },
  {
    id: "theme_sample_meadow",
    name: "Meadow",
    slug: "meadow",
    ownerId: people.priya.id,
    colors: { background: "dark", foreground: "light", accent: "green" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#efeff0", "#1b1b1d", "#d97b00", "#170d00", "#d97b00"),
    dark: palette("#09090a", "#ebebec", "#58c24c", "#000000", "#58c24c"),
    effect: "vignette",
    background: null,
    listingVersionId: null,
    published: true,
    version: 1,
    createdAt: isoMinutesAgo(6 * 24 * 60),
    updatedAt: isoMinutesAgo(90),
  },
] as const;

export const samplePublications = [
  {
    id: "pub_sample_aurora",
    themeId: "theme_sample_aurora",
    name: "Aurora",
    version: 2,
    authorId: people.alex.id,
    status: "published",
    publishedAt: isoMinutesAgo(3 * 24 * 60),
    slug: "aurora",
    listed: true,
    withdrawn: false,
    removed: false,
    removedReason: null,
    adds: 3,
    versions: [
      {
        id: "ver_sample_aurora_2",
        version: 2,
        createdAt: isoMinutesAgo(3 * 24 * 60),
        reviewed: true,
        removed: false,
      },
      {
        id: "ver_sample_aurora_1",
        version: 1,
        createdAt: isoMinutesAgo(18 * 24 * 60),
        reviewed: true,
        removed: false,
      },
    ],
  },
  {
    id: "pub_sample_meadow",
    themeId: "theme_sample_meadow",
    name: "Meadow",
    version: 1,
    authorId: people.priya.id,
    status: "published",
    publishedAt: isoMinutesAgo(5 * 24 * 60),
    slug: "meadow",
    listed: true,
    withdrawn: false,
    removed: false,
    removedReason: null,
    adds: 0,
    versions: [
      {
        id: "ver_sample_meadow_1",
        version: 1,
        createdAt: isoMinutesAgo(6 * 24 * 60),
        reviewed: true,
        removed: false,
      },
    ],
  },
  {
    id: "pub_sample_everforest",
    themeId: "everforest",
    name: "Everforest",
    version: 1,
    authorId: people.priya.id,
    status: "published",
    publishedAt: isoMinutesAgo(9 * 24 * 60),
  },
] as const;

export const presetIds = presetThemeIds;
