import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatVersion,
  lightDarkCaption,
  listingParams,
  makerName,
  themeFacts,
  trimDescription,
} from "./format";
import type { ExploreTheme, ThemeListing, ThemeListingCard } from "./types";

const card: ThemeListingCard = {
  kind: "theme",
  slug: "harbor",
  versionId: "ver_1",
  displayName: "Harbor",
  description: "Calm blues for long sessions.",
  source: "user",
  builtIn: null,
  maker: { name: "Sample Maker" },
  adds: null,
  version: "1.0.0",
  updatedAt: Date.UTC(2026, 9, 2, 12),
  featuredRank: null,
  popularRank: null,
  theme: { light: {}, dark: {} },
};

const listing = (overrides: Partial<ThemeListingCard> = {}): ThemeListing => ({
  card: { ...card, ...overrides },
  versions: [{ id: "ver_1", createdAt: Date.UTC(2026, 9, 28, 12) }],
});

const plain: ExploreTheme = { light: {}, dark: {} };
const full: ExploreTheme = {
  light: {},
  dark: {},
  wallpaper: { name: "Night harbor" },
  appearance: { effect: "dither" },
};

describe("themeFacts", () => {
  it("lists maker, wallpaper, effect and version like Capy", () => {
    expect(themeFacts(listing(), full)).toEqual([
      ["Made by", "Sample Maker"],
      ["Wallpaper", "Night harbor"],
      ["Effect", "Dither"],
      ["Version", "1.0.0, Oct 28"],
    ]);
  });

  it("counts adds and falls back to the default effect", () => {
    const facts = themeFacts(listing({ adds: 1 }), {
      ...plain,
      appearance: {},
    });
    expect(facts).toContainEqual(["Added", "Once"]);
    expect(facts).toContainEqual(["Effect", "Dither"]);
    expect(themeFacts(listing({ adds: 1520 }), plain)).toContainEqual([
      "Added",
      "1.5k times",
    ]);
  });

  it("drops the version row when there is no version", () => {
    expect(themeFacts(listing({ version: null, maker: null }), plain)).toEqual([
      ["Made by", "Capy"],
    ]);
  });

  it("dates the version from the card when there are no versions", () => {
    const facts = themeFacts({ card, versions: [] }, plain);
    expect(facts.at(-1)).toEqual(["Version", "1.0.0, Oct 2"]);
  });
});

describe("helpers", () => {
  it("names the maker", () => {
    expect(makerName(card)).toBe("Sample Maker");
    expect(makerName({ ...card, maker: null })).toBe("Capy");
    expect(makerName({ ...card, kind: "skill", maker: null })).toBeUndefined();
    expect(makerName({ ...card, builtIn: {} })).toBe("Built in");
  });

  it("formats versions, counts and descriptions", () => {
    expect(formatVersion("a".repeat(40))).toBe("aaaaaaa");
    expect(formatVersion("2.1.0")).toBe("2.1.0");
    expect(formatCount(12)).toBe("12");
    expect(formatCount(2_400_000)).toBe("2.4m");
    expect(trimDescription("Soft greens.")).toBe("Soft greens");
  });

  it("builds route params and captions", () => {
    expect(listingParams(card)).toEqual({ kind: "themes", slug: "harbor" });
    expect(lightDarkCaption(plain)).toBe("Adding it applies these colors");
    expect(lightDarkCaption(full)).toBe(
      "Adding it applies these colors with the wallpaper and effect",
    );
  });
});
