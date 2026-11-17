import { describe, expect, it } from "vitest";
import {
  browsePlugins,
  PAGE_SIZE,
  type PluginBrowseCard,
  SHELF_SIZE,
} from "./catalog";

const card = (
  slug: string,
  overrides: Partial<PluginBrowseCard> = {},
): PluginBrowseCard => ({
  slug,
  displayName: slug,
  category: "monitoring",
  builtIn: null,
  featuredRank: null,
  firstListedAt: new Date(Date.UTC(2026, 0, 1)),
  ...overrides,
});

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

describe("browsePlugins shelves", () => {
  it("orders featured by rank, recent by listing date, and fills category shelves", () => {
    const cards = [
      card("alpha", { featuredRank: 2, firstListedAt: day(1) }),
      card("bravo", {
        featuredRank: 1,
        firstListedAt: day(3),
        category: "docs",
      }),
      card("charlie", { firstListedAt: null, category: "docs" }),
      card("delta", { builtIn: "github" }),
    ];
    const view = browsePlugins(cards, {});
    if (view.kind !== "shelves") throw new Error(view.kind);
    expect(view.shelves.map((shelf) => shelf.title)).toEqual([
      "Featured",
      "Recently added",
      "Monitoring",
      "Docs",
      "Integrations",
    ]);
    expect(view.shelves[0]?.cards.map((c) => c.slug)).toEqual([
      "bravo",
      "alpha",
    ]);
    expect(view.shelves[1]?.cards.map((c) => c.slug)).toEqual([
      "bravo",
      "alpha",
    ]);
    expect(view.shelves[3]?.cards.map((c) => c.slug)).toEqual([
      "bravo",
      "charlie",
    ]);
    expect(view.shelves[4]?.viewAll).toBeUndefined();
    expect(view.shelves[2]?.viewAll).toEqual({ category: "monitoring" });
  });

  it("keeps the recent shelf when nothing is new and caps shelves", () => {
    const cards = Array.from({ length: SHELF_SIZE + 3 }, (_, index) =>
      card(`p${index}`, { firstListedAt: null }),
    );
    const view = browsePlugins(cards, {});
    if (view.kind !== "shelves") throw new Error(view.kind);
    expect(view.shelves[0]).toMatchObject({
      title: "Recently added",
      cards: [],
    });
    expect(view.shelves[1]?.cards).toHaveLength(SHELF_SIZE);
  });
});

describe("browsePlugins narrowed", () => {
  it("pages results and clamps the page", () => {
    const cards = Array.from({ length: PAGE_SIZE + 5 }, (_, index) =>
      card(`p${String(index).padStart(2, "0")}`),
    );
    const view = browsePlugins(cards, { category: "monitoring", page: 9 });
    expect(view).toMatchObject({
      kind: "results",
      title: "Monitoring",
      page: 2,
      pages: 2,
    });
    if (view.kind === "results") expect(view.cards).toHaveLength(5);
  });

  it("shows search results as given", () => {
    const view = browsePlugins([card("a", { builtIn: "x" })], { q: "a" });
    expect(view).toMatchObject({ kind: "results", title: "Search results" });
  });

  it("uses Capy's empty copy", () => {
    expect(browsePlugins([], { section: "recent" })).toMatchObject({
      line: "No new plugins yet",
      art: "sleep",
      action: "All plugins",
    });
    expect(browsePlugins([], { section: "featured" })).toMatchObject({
      line: "No featured plugins yet",
    });
    expect(browsePlugins([], { category: "payments" })).toMatchObject({
      line: "No payments plugins yet",
      sub: "Newly listed plugins appear here",
    });
    expect(browsePlugins([], { q: "zzz" })).toMatchObject({
      line: "No plugins match that search",
      sub: "Try another word or clear the search",
      art: "peer",
      action: "Clear search",
    });
  });
});
