import { describe, expect, it } from "vitest";
import type { ThemeListingCard } from "../theme-detail";
import { arrangeThemes, pageWindow, themeByline } from "./arrange";

const theme = (
  slug: string,
  overrides: Partial<ThemeListingCard> = {},
): ThemeListingCard => ({
  kind: "theme",
  slug,
  versionId: null,
  displayName: slug,
  description: "",
  source: "user",
  builtIn: null,
  maker: { name: "Sample Maker" },
  adds: 0,
  version: null,
  updatedAt: 0,
  featuredRank: null,
  popularRank: null,
  theme: { light: {}, dark: {} },
  ...overrides,
});

const slugs = (cards: ReadonlyArray<ThemeListingCard>) =>
  cards.map((c) => c.slug);

describe("pageWindow", () => {
  it("clamps the page to the page count", () => {
    expect(pageWindow(0, 1)).toEqual({ pages: 1, current: 1 });
    expect(pageWindow(25, 9)).toEqual({ pages: 3, current: 3 });
  });
});

describe("arrangeThemes", () => {
  it("features the top ranked Capy theme and groups the rest", () => {
    const layout = arrangeThemes(
      [
        theme("ink", { source: "capy", featuredRank: 2 }),
        theme("dune", { source: "capy", featuredRank: 1 }),
        theme("moss"),
        theme("plugin", { kind: "plugin", theme: null }),
      ],
      {},
    );
    expect(layout.kind).toBe("browse");
    if (layout.kind !== "browse") return;
    expect(layout.featured?.slug).toBe("dune");
    expect(slugs(layout.byCapy)).toEqual(["ink"]);
    expect(slugs(layout.community)).toEqual(["moss"]);
    expect(layout.communityEmpty).toBe("No community themes yet");
  });

  it("picks the most added community theme with a wallpaper as a community pick", () => {
    const wallpaper = { light: {}, dark: {}, wallpaper: { name: "Sea" } };
    const layout = arrangeThemes(
      [
        theme("plain", { adds: 90 }),
        theme("sea", { adds: 3, theme: wallpaper }),
        theme("sky", { adds: 12, theme: wallpaper }),
      ],
      {},
    );
    if (layout.kind !== "browse") throw new Error("expected browse");
    expect(layout.featured?.slug).toBe("sky");
    expect(slugs(layout.community)).toEqual(["plain", "sea"]);
  });

  it("says no other community themes when the only one is featured", () => {
    const layout = arrangeThemes(
      [
        theme("sky", {
          theme: { light: {}, dark: {}, wallpaper: { name: "Sky" } },
        }),
      ],
      {},
    );
    if (layout.kind !== "browse") throw new Error("expected browse");
    expect(layout.community).toEqual([]);
    expect(layout.showCommunity).toBe(true);
    expect(layout.communityEmpty).toBe("No other community themes yet");
  });

  it("pages twelve at a time and hides the featured theme after page one", () => {
    const cards = Array.from({ length: 14 }, (_, i) =>
      theme(`t${i}`, { source: "capy", featuredRank: i === 0 ? 1 : null }),
    );
    const first = arrangeThemes(cards, {});
    const second = arrangeThemes(cards, { page: 2 });
    if (first.kind !== "browse" || second.kind !== "browse") throw new Error();
    expect(first.byCapy).toHaveLength(12);
    expect(first.pages).toBe(2);
    expect(second.featured).toBeUndefined();
    expect(slugs(second.byCapy)).toEqual(["t13"]);
    expect(second.showCommunity).toBe(false);
  });

  it("lists every theme in a flat grid while searching", () => {
    const layout = arrangeThemes([theme("a", { source: "capy" }), theme("b")], {
      q: "a",
    });
    expect(layout).toMatchObject({ kind: "search", pages: 1, current: 1 });
    if (layout.kind === "search")
      expect(slugs(layout.cards)).toEqual(["a", "b"]);
  });
});

describe("themeByline", () => {
  it("adds the count only when the theme was added", () => {
    const format = (n: number) => String(n);
    expect(themeByline("Capy", null, format)).toBe("By Capy");
    expect(themeByline("Capy", 0, format)).toBe("By Capy");
    expect(themeByline("Capy", 1, format)).toBe("By Capy, added 1 time");
    expect(themeByline("Capy", 4, format)).toBe("By Capy, added 4 times");
  });
});

describe("the Popular pass", () => {
  const ranked = (slug: string, popularRank: number | null, extra = {}) =>
    theme(slug, { popularRank, ...extra });

  it("draws the ranked themes in the server's order, not by adds", () => {
    const layout = arrangeThemes(
      [
        ranked("loud", null, { adds: 24 }),
        ranked("fuji", 1, { source: "capy" }),
        ranked("classic", 2),
        ranked("akane", 3, { source: "capy" }),
        ranked("kiki", 4, { adds: 0 }),
      ],
      {},
    );
    expect(layout.kind).toBe("browse");
    if (layout.kind !== "browse") return;
    expect(slugs(layout.popular)).toEqual(["fuji", "classic", "akane", "kiki"]);
  });

  it("draws at most four, even when the server ranks more", () => {
    const layout = arrangeThemes(
      [1, 2, 3, 4, 5, 6].map((rank) => ranked(`theme-${rank}`, rank)),
      {},
    );
    if (layout.kind !== "browse") throw new Error("expected a browse layout");
    expect(layout.popular).toHaveLength(4);
    expect(slugs(layout.popular)).toEqual([
      "theme-1",
      "theme-2",
      "theme-3",
      "theme-4",
    ]);
  });

  it("leaves the featured card out, so the section does not repeat it", () => {
    const layout = arrangeThemes(
      [
        ranked("holy-night", 1, { source: "capy", featuredRank: 1 }),
        ranked("fuji", 2, { source: "capy" }),
      ],
      {},
    );
    if (layout.kind !== "browse") throw new Error("expected a browse layout");
    expect(layout.featured?.slug).toBe("holy-night");
    expect(slugs(layout.popular)).toEqual(["fuji"]);
  });

  it("draws nothing when no card carries a rank", () => {
    const layout = arrangeThemes([theme("plain"), theme("other")], {});
    if (layout.kind !== "browse") throw new Error("expected a browse layout");
    expect(layout.popular).toEqual([]);
  });

  it("keeps the ranked cards in the page below it, as Capy repeats them", () => {
    const layout = arrangeThemes(
      [ranked("fuji", 1, { source: "capy" }), theme("kiki")],
      {},
    );
    if (layout.kind !== "browse") throw new Error("expected a browse layout");
    expect(slugs(layout.byCapy)).toContain("fuji");
  });
});
