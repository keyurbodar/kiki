import { describe, expect, it } from "vitest";
import {
  filterItems,
  matchText,
  normalizeQuery,
  rankItems,
} from "./fuzzy-search";

describe("fuzzy-search", () => {
  it("normalizes queries", () => {
    expect(normalizeQuery("  Web   App ")).toBe("web app");
  });

  it("ranks exact over prefix over word over substring", () => {
    expect(matchText("web", "web")?.tier).toBe("exact");
    expect(matchText("website", "web")?.tier).toBe("prefix");
    expect(matchText("acme web", "web")?.tier).toBe("word");
    expect(matchText("cobweb", "web")?.tier).toBe("substring");
  });

  it("matches word-start initials fuzzily", () => {
    expect(matchText("legacy-site", "lesi")?.tier).toBe("fuzzy");
    expect(matchText("legacy", "x")).toBeUndefined();
  });

  it("matches multi-word queries across words", () => {
    expect(matchText("Acme web app", "web acme")?.tier).toBe("word");
  });

  it("weights secondary fields at half and ignores weak matches there", () => {
    const items = [
      { name: "Docs", repos: ["acme/web"] },
      { name: "Web app", repos: [] },
    ];
    const ranked = rankItems(items, (p) => [p.name, ...p.repos], "web");
    expect(ranked.map((r) => r.item.name)).toEqual(["Web app", "Docs"]);
    expect(filterItems(items, (p) => [p.name, ...p.repos], "ebap")).toEqual([]);
  });

  it("returns every item for an empty query", () => {
    expect(filterItems(["a", "b"], (s) => [s], " ")).toEqual(["a", "b"]);
  });
});
