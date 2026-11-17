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
) => ({
  background: literal(background),
  foreground: literal(foreground),
  text: literal(foreground),
  accent: literal(accent),
  accentText: literal(accentText),
  shaderInk: literal(accent),
});

export const sampleThemes = [
  {
    id: "theme_sample_aurora",
    name: "Aurora",
    slug: "aurora",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "blue" },
    fontFamily: "Inter",
    fontSize: 14,
    light: palette("#eef2f5", "#1d2730", "#2f7fa8", "#ffffff"),
    dark: palette("#0c1318", "#dde6ec", "#4aa3cf", "#05121a"),
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
    colors: { background: "light", foreground: "dark", accent: "orange" },
    fontFamily: "Georgia",
    fontSize: 15,
    light: palette("#f5f0ee", "#2e2421", "#c4552d", "#ffffff"),
    dark: palette("#140d0b", "#efe2dc", "#e2734a", "#1f0b04"),
    effect: "grain",
    background: null,
    listingVersionId: null,
    published: false,
    version: 1,
    createdAt: isoMinutesAgo(12 * 24 * 60),
    updatedAt: isoMinutesAgo(2 * 60),
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
