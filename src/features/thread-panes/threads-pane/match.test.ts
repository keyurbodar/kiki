import { describe, expect, it } from "vitest";
import { entriesEmptyText, matchesQuery, visibleEntries } from "./match";
import { showsSideThreadsPage } from "./side-threads-page";

describe("showsSideThreadsPage", () => {
  it("shows the page for a blank or whitespace query", () => {
    expect(showsSideThreadsPage("", 0, false)).toBe(true);
    expect(showsSideThreadsPage("   ", 0, false)).toBe(true);
  });

  it("hides it when nothing matches", () => {
    expect(showsSideThreadsPage("deploy", 0, false)).toBe(false);
    expect(showsSideThreadsPage("side", 0, true)).toBe(true);
    expect(showsSideThreadsPage("deploy", 2, false)).toBe(true);
  });
});

describe("matchesQuery", () => {
  it("matches everything for a blank query", () => {
    expect(matchesQuery("  ", "Anything")).toBe(true);
    expect(matchesQuery("")).toBe(true);
  });

  it("matches any field, case-insensitively and trimmed", () => {
    expect(matchesQuery(" RETRY ", "Add a retry budget")).toBe(true);
    expect(matchesQuery("acme-7", undefined, "ACME-7")).toBe(true);
    expect(matchesQuery("lint", null, "Fix the build")).toBe(false);
  });
});

describe("visibleEntries", () => {
  const rows = Array.from({ length: 7 }, (_, i) => i);

  it("shows everything without a page size", () => {
    expect(visibleEntries(rows, 1, undefined)).toEqual({
      visible: rows,
      hasMore: false,
    });
  });

  it("grows one page at a time", () => {
    expect(visibleEntries(rows, 1, 3)).toEqual({
      visible: [0, 1, 2],
      hasMore: true,
    });
    expect(visibleEntries(rows, 3, 3)).toEqual({
      visible: rows,
      hasMore: false,
    });
  });
});

describe("entriesEmptyText", () => {
  it("names the page when nothing is searched", () => {
    expect(entriesEmptyText("All threads", "")).toBe("No all threads");
    expect(entriesEmptyText("Side threads", " ")).toBe("No side threads");
  });

  it("reports no matches for a search", () => {
    expect(entriesEmptyText("Side threads", "deploy")).toBe("No matches");
  });
});
