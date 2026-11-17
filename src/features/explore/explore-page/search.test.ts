import { expect, it } from "vitest";
import {
  exploreKindFromPath,
  exploreKindOf,
  exploreLabelFor,
  exploreSearchFor,
  parseExploreSearch,
} from "./search";

it("maps the route segment to a kind and back", () => {
  expect(exploreKindFromPath("plugins")).toBe("plugin");
  expect(exploreKindFromPath("skills")).toBe("skill");
  expect(exploreKindFromPath("themes")).toBe("theme");
  expect(exploreKindFromPath("teams")).toBeUndefined();
});

it("defaults the tab to plugins", () => {
  expect(exploreKindOf({})).toBe("plugin");
  expect(exploreKindOf({ tab: "skill" })).toBe("skill");
});

it("keeps only valid search params", () => {
  expect(
    parseExploreSearch({
      tab: "theme",
      q: "harbor",
      section: "recent",
      category: "docs",
      page: 3,
    }),
  ).toEqual({
    tab: "theme",
    q: "harbor",
    section: "recent",
    category: "docs",
    page: 3,
  });
  expect(
    parseExploreSearch({ tab: "plugin", section: "all", category: "x" }),
  ).toEqual({});
  expect(parseExploreSearch({ q: "" })).toEqual({});
  expect(parseExploreSearch({ page: 1 })).toEqual({});
  expect(parseExploreSearch({ page: 2.5 })).toEqual({});
});

it("clamps the query length and the page", () => {
  expect(parseExploreSearch({ q: "a".repeat(300) }).q).toHaveLength(200);
  expect(parseExploreSearch({ page: 1e9 }).page).toBe(100_000);
});

it("drops the plugin tab and keeps the rest when switching kind", () => {
  expect(exploreSearchFor({ q: "x", tab: "skill" }, "plugin")).toEqual({
    q: "x",
    tab: undefined,
  });
  expect(exploreSearchFor({ q: "x" }, "theme")).toEqual({
    q: "x",
    tab: "theme",
  });
});

it("lowercases kind labels for empty-state copy", () => {
  expect(exploreLabelFor("skill")).toBe("skills");
  expect(exploreLabelFor("theme")).toBe("themes");
});
