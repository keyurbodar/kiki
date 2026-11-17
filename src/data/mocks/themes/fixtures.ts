import { isoMinutesAgo, people, presetThemeIds } from "../fixtures/world.ts";

export const sampleThemes = [
  {
    id: "theme_sample_aurora",
    name: "Aurora",
    slug: "aurora",
    ownerId: people.alex.id,
    colors: { background: "dark", foreground: "light", accent: "blue" },
    fontFamily: "Inter",
    fontSize: 14,
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
