import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import {
  ExploreCard,
  ExploreListing,
  ExploreVersion,
} from "@/data/api/schemas/explore";
import { readTheme, themeDetail } from "./theme-data";

const at = (iso: string) => DateTime.makeUnsafe(iso);

const palette = {
  "--bg": "#101010",
  "--panel": "#202020",
  "--fg": "#f5f5f5",
  "--primary": "#7ad0ff",
};

const card = new ExploreCard({
  kind: "theme",
  source: "catalog",
  slug: "sample-theme",
  displayName: "Sample Theme",
  description: "A calm palette for long sessions.",
  maker: { name: "Acme" },
  accent: null,
  category: null,
  firstListedAt: null,
  featuredRank: null,
  popularRank: null,
  hasIcon: false,
  repository: null,
  stars: null,
  starsCheckedAt: null,
  adds: 2400,
  version: "1.2.0",
  versionId: "ver_sample",
  theme: null,
  builtIn: null,
  createdAt: at("2026-10-01T09:00:00Z"),
  updatedAt: at("2026-11-02T12:00:00Z"),
});

const listing = (theme: unknown) =>
  new ExploreListing({
    card,
    content: { kind: "theme", theme },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "ver_sample",
        version: "1.2.0",
        notes: "Evened out the contrast.",
        createdAt: at("2026-11-02T12:00:00Z"),
      }),
    ],
  });

describe("readTheme", () => {
  it("reads the palettes, the wallpaper name and a known effect", () => {
    expect(
      readTheme({
        light: palette,
        dark: palette,
        wallpaper: { name: "Dunes" },
        appearance: { effect: "vignette" },
      }),
    ).toEqual({
      light: palette,
      dark: palette,
      wallpaper: { name: "Dunes" },
      appearance: { effect: "vignette" },
    });
  });

  it("keeps an appearance with the default effect when the value is unknown", () => {
    expect(
      readTheme({ light: palette, dark: palette, appearance: { effect: "x" } }),
    ).toEqual({
      light: palette,
      dark: palette,
      appearance: { effect: "dither" },
    });
  });

  it("rejects anything without two string palettes", () => {
    expect(readTheme(null)).toBeUndefined();
    expect(readTheme("theme")).toBeUndefined();
    expect(readTheme({ dark: palette })).toBeUndefined();
    expect(readTheme({ light: palette, dark: { "--bg": 1 } })).toBeUndefined();
  });

  it("drops a wallpaper without a name", () => {
    expect(
      readTheme({ light: palette, dark: palette, wallpaper: { name: 1 } }),
    ).toEqual({ light: palette, dark: palette });
  });
});

describe("themeDetail", () => {
  const detail = themeDetail(
    listing({
      light: palette,
      dark: palette,
      wallpaper: { name: "Dunes" },
      appearance: { effect: "grain" },
    }),
  );

  it("maps the listing onto the theme detail props", () => {
    expect(detail?.theme).toEqual({
      light: palette,
      dark: palette,
      wallpaper: { name: "Dunes" },
      appearance: { effect: "grain" },
    });
    expect(detail?.listing.card).toMatchObject({
      kind: "theme",
      slug: "sample-theme",
      displayName: "Sample Theme",
      versionId: "ver_sample",
      source: "capy",
      adds: 2400,
      version: "1.2.0",
      theme: { light: palette, dark: palette, wallpaper: { name: "Dunes" } },
    });
    expect(detail?.listing.card.updatedAt).toEqual(
      new Date("2026-11-02T12:00:00Z"),
    );
    expect(detail?.listing.versions).toEqual([
      { id: "ver_sample", createdAt: new Date("2026-11-02T12:00:00Z") },
    ]);
  });

  it("takes the theme from the card when the content is not a theme", () => {
    const withCardTheme = new ExploreListing({
      card: new ExploreCard({
        ...card,
        theme: { light: palette, dark: palette },
      }),
      content: { kind: "builtIn" },
      setup: null,
      versions: [],
    });
    expect(themeDetail(withCardTheme)?.theme).toEqual({
      light: palette,
      dark: palette,
    });
  });

  it("gives up when neither payload carries a palette", () => {
    expect(themeDetail(listing(undefined))).toBeUndefined();
  });
});
