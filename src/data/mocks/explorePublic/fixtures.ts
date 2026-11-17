import { isoMinutesAgo, people, presetThemeIds } from "../fixtures/world.ts";

export type ListingKind = "plugin" | "skill" | "theme";

export interface PublicListing {
  readonly kind: ListingKind;
  readonly slug: string;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly authorId: string;
  readonly icon: { readonly url: string; readonly mimeType: string };
  readonly wallpaper: { readonly url: string; readonly mimeType: string };
  readonly featured: boolean;
  readonly installs: number;
  readonly rating: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const iconUrl = (kind: ListingKind, slug: string) =>
  `https://icons.example.com/explore/${kind}/${slug}.png`;

const wallpaperUrl = (slug: string) =>
  `https://wallpapers.example.com/themes/${slug}.png`;

const listing = (
  kind: ListingKind,
  slug: string,
  displayName: string,
  description: string,
  authorId: string,
  featured: boolean,
  installs: number,
  rating: number,
  updatedMinutesAgo: number,
): PublicListing => ({
  kind,
  slug,
  name: slug,
  displayName,
  description,
  authorId,
  icon: { url: iconUrl(kind, slug), mimeType: "image/png" },
  wallpaper: { url: wallpaperUrl(slug), mimeType: "image/png" },
  featured,
  installs,
  rating,
  createdAt: isoMinutesAgo(updatedMinutesAgo + 60 * 24),
  updatedAt: isoMinutesAgo(updatedMinutesAgo),
});

export const sampleListings: ReadonlyArray<PublicListing> = [
  listing(
    "plugin",
    "release-notes",
    "Release Notes",
    "Collects release notes from linked pull requests into a changelog.",
    people.sam.id,
    true,
    1840,
    4.8,
    45,
  ),
  listing(
    "plugin",
    "error-tracker",
    "Error Tracker",
    "Links failing requests to the thread that introduced them.",
    people.alex.id,
    true,
    920,
    4.6,
    2 * 60 * 24,
  ),
  listing(
    "plugin",
    "docs-search",
    "Docs Search",
    "Searches the project docs from the command palette.",
    people.priya.id,
    false,
    310,
    4.3,
    6 * 60 * 24,
  ),
  listing(
    "skill",
    "code-review",
    "Code Review",
    "Reviews a pull request against the project's contributing guide.",
    people.sam.id,
    true,
    2760,
    4.9,
    3 * 60,
  ),
  listing(
    "skill",
    "release-checklist",
    "Release Checklist",
    "Walks through the release steps and records each result.",
    people.alex.id,
    false,
    480,
    4.5,
    4 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[0],
    "Absolutely",
    "A bright, high-contrast theme for focused work.",
    people.jordan.id,
    true,
    5120,
    4.9,
    12 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[2],
    "Catppuccin",
    "A soft pastel theme with a calm palette.",
    people.casey.id,
    false,
    3910,
    4.8,
    8 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[10],
    "Linear",
    "A dark, minimal theme for long sessions.",
    people.priya.id,
    false,
    2280,
    4.7,
    15 * 60 * 24,
  ),
];

export const listingKinds: ReadonlyArray<ListingKind> = [
  "plugin",
  "skill",
  "theme",
];
