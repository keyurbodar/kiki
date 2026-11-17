import { describe, expect, it } from "vitest";
import {
  isDefaultSidebarNav,
  moveSidebarNavItem,
  normalizeSidebarNav,
  SIDEBAR_NAV_DEFAULTS,
  type SidebarNavEntry,
  sidebarNavPages,
  splitSidebarBar,
  toggleSidebarNavItem,
  toSidebarNavPreference,
} from "./sidebar-nav";

const items = (entries: ReadonlyArray<SidebarNavEntry>) =>
  entries.map((entry) => entry.item);

describe("normalizeSidebarNav", () => {
  it("falls back to the defaults when nothing is saved", () => {
    expect(normalizeSidebarNav(undefined)).toEqual(SIDEBAR_NAV_DEFAULTS);
    expect(normalizeSidebarNav(null)).toEqual(SIDEBAR_NAV_DEFAULTS);
  });

  it("drops unknown and duplicate items and slots missing defaults before their next neighbour", () => {
    const result = normalizeSidebarNav([
      { item: "explore" },
      { item: "projects" },
      { item: "threads", hidden: true },
      { item: "explore" },
    ]);
    expect(items(result)).toEqual([
      "issues",
      "pullRequests",
      "automations",
      "explore",
      "newThread",
      "threads",
      "volumes",
      "memory",
    ]);
    expect(result.find((entry) => entry.item === "threads")?.hidden).toBe(true);
  });
});

describe("preference round trip", () => {
  it("stores null for the default order and the entries otherwise", () => {
    const defaults = normalizeSidebarNav(undefined);
    expect(isDefaultSidebarNav(defaults)).toBe(true);
    expect(toSidebarNavPreference(defaults)).toBeNull();
    const hidden = toggleSidebarNavItem(defaults, "issues");
    expect(isDefaultSidebarNav(hidden)).toBe(false);
    expect(toSidebarNavPreference(hidden)).toBe(hidden);
  });

  it("toggles hidden on and back off", () => {
    const once = toggleSidebarNavItem(SIDEBAR_NAV_DEFAULTS, "explore");
    expect(once.find((entry) => entry.item === "explore")).toEqual({
      item: "explore",
      hidden: true,
    });
    const twice = toggleSidebarNavItem(once, "explore");
    expect(twice.find((entry) => entry.item === "explore")).toEqual({
      item: "explore",
      hidden: undefined,
    });
  });
});

describe("sidebarNavPages", () => {
  it("leaves out New thread, and Memory unless enabled", () => {
    expect(items(sidebarNavPages(SIDEBAR_NAV_DEFAULTS))).toEqual([
      "threads",
      "issues",
      "pullRequests",
      "automations",
      "explore",
      "volumes",
    ]);
    expect(
      items(sidebarNavPages(SIDEBAR_NAV_DEFAULTS, { memory: true })),
    ).toContain("memory");
  });
});

describe("moveSidebarNavItem", () => {
  it("drops an item before or after the target", () => {
    const pages = sidebarNavPages(SIDEBAR_NAV_DEFAULTS);
    expect(
      items(
        moveSidebarNavItem(pages, "volumes", { item: "threads", after: false }),
      ),
    ).toEqual([
      "volumes",
      "threads",
      "issues",
      "pullRequests",
      "automations",
      "explore",
    ]);
    expect(
      items(
        moveSidebarNavItem(pages, "threads", { item: "issues", after: true }),
      ),
    ).toEqual([
      "issues",
      "threads",
      "pullRequests",
      "automations",
      "explore",
      "volumes",
    ]);
  });
});

describe("splitSidebarBar", () => {
  const pages = sidebarNavPages(SIDEBAR_NAV_DEFAULTS);

  it("shows every page without More when they fit or before measuring", () => {
    expect(splitSidebarBar(pages, null)).toEqual({
      shown: pages,
      overflow: [],
      more: false,
    });
    expect(splitSidebarBar(pages, 6).more).toBe(false);
  });

  it("keeps one slot for More when the bar overflows", () => {
    const { shown, overflow, more } = splitSidebarBar(pages, 4);
    expect(more).toBe(true);
    expect(items(shown)).toEqual(["threads", "issues", "pullRequests"]);
    expect(items(overflow)).toEqual(["automations", "explore", "volumes"]);
  });

  it("shows More with the hidden pages once a page is hidden", () => {
    const hidden = toggleSidebarNavItem(pages, "explore");
    const { shown, overflow, more } = splitSidebarBar(hidden, 10);
    expect(more).toBe(true);
    expect(items(shown)).toEqual([
      "threads",
      "issues",
      "pullRequests",
      "automations",
      "volumes",
    ]);
    expect(items(overflow)).toEqual(["explore"]);
  });
});
