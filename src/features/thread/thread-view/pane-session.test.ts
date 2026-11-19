import { describe, expect, it } from "vitest";
import type { PaneTab } from "@/features/thread-panes/tab-strip";
import {
  fullTileRect,
  layoutTiles,
} from "@/features/thread-panes/tile-surface";
import {
  closeTab,
  DOCK_GROUP,
  emptySession,
  focusedGroup,
  groupOfTab,
  isTransientTab,
  moveTab,
  openTab,
  seedSession,
  selectTab,
  sessionGroups,
  setGroupRatio,
  setTabFocus,
  splitTab,
  tabsInGroup,
} from "./pane-session";

const overview: PaneTab = { kind: "overview" };
const pr: PaneTab = {
  kind: "pr",
  number: 435,
  url: "https://github.com/keyurbodar/kiki/pull/435",
};
const issue: PaneTab = { kind: "issue", code: "AMA-175" };
const file: PaneTab = { kind: "file", path: "src/routes/__root.tsx" };

const keys = (tabs: readonly PaneTab[]) =>
  tabs.map((tab) => {
    switch (tab.kind) {
      case "pr":
        return `pr:${tab.number}`;
      case "issue":
        return tab.code;
      case "file":
        return tab.path;
      default:
        return tab.kind;
    }
  });

describe("openTab", () => {
  it("keeps a pull request and an issue open together", () => {
    const session = openTab(openTab(emptySession, pr), issue);
    expect(keys(session.tabs)).toEqual([`pr:435`, "AMA-175"]);
    expect(session.active).toBe("issue:AMA-175");
  });

  it("adds a file beside them while it is on screen", () => {
    const session = openTab(openTab(openTab(emptySession, pr), issue), file);
    expect(keys(session.tabs)).toEqual([
      "pr:435",
      "AMA-175",
      "src/routes/__root.tsx",
    ]);
    expect(session.active).toBe("file:::src/routes/__root.tsx");
  });

  it("brings an already open tab forward instead of duplicating it", () => {
    const once = openTab(emptySession, pr);
    const twice = openTab(once, pr);
    expect(twice.tabs).toHaveLength(1);
    expect(twice.active).toBe(once.active);
  });

  it("replaces a held tab, so a second ask carries its new intent", () => {
    const session = openTab(emptySession, { kind: "files" });
    const focused = openTab(session, { kind: "files", focus: "search" });
    expect(focused.tabs).toHaveLength(1);
    expect(focused.tabs[0]).toEqual({ kind: "files", focus: "search" });
  });
});

describe("setTabFocus", () => {
  it("asks the files tab for its search field, and clears the ask", () => {
    const session = openTab(emptySession, { kind: "files" });
    const asked = setTabFocus(session, "files", "search");
    expect(asked.tabs[0]).toEqual({ kind: "files", focus: "search" });
    expect(setTabFocus(asked, "files", undefined).tabs[0]).toEqual({
      kind: "files",
    });
  });

  it("leaves other pane kinds alone", () => {
    const session = openTab(emptySession, overview);
    expect(setTabFocus(session, "overview", "search")).toBe(session);
  });
});

describe("selectTab", () => {
  it("keeps the pull request and the issue when the file tab is left", () => {
    const session = openTab(openTab(openTab(emptySession, pr), issue), file);
    const next = selectTab(session, "pr:keyurbodar/kiki#435");
    expect(keys(next.tabs)).toEqual(["pr:435", "AMA-175"]);
    expect(next.active).toBe("pr:keyurbodar/kiki#435");
  });

  it("ignores a tab that is not open", () => {
    const session = openTab(emptySession, pr);
    expect(selectTab(session, "issue:AMA-1")).toBe(session);
  });
});

describe("closeTab", () => {
  it("moves to the neighbour when the active tab closes", () => {
    const session = openTab(
      openTab(openTab(emptySession, pr), issue),
      overview,
    );
    const next = closeTab(session, "overview");
    expect(keys(next.tabs)).toEqual(["pr:435", "AMA-175"]);
    expect(next.active).toBe("issue:AMA-175");
  });

  it("falls back to no pane when the last tab closes", () => {
    const next = closeTab(openTab(emptySession, pr), "pr:keyurbodar/kiki#435");
    expect(next).toEqual(emptySession);
  });

  it("leaves the active tab alone when a background tab closes", () => {
    const session = openTab(openTab(emptySession, pr), issue);
    const next = closeTab(session, "pr:keyurbodar/kiki#435");
    expect(next.active).toBe("issue:AMA-175");
    expect(keys(next.tabs)).toEqual(["AMA-175"]);
  });
});

describe("transient tabs", () => {
  it("treats the three file kinds as transient and the rest as sticky", () => {
    expect(isTransientTab(file)).toBe(true);
    expect(isTransientTab({ kind: "drive_file", path: "handoff.md" })).toBe(
      true,
    );
    expect(
      isTransientTab({ kind: "attachment", id: "a1", name: "log.txt" }),
    ).toBe(true);
    expect(isTransientTab(pr)).toBe(false);
    expect(isTransientTab(issue)).toBe(false);
    expect(isTransientTab(overview)).toBe(false);
  });

  it("drops the file tab as soon as another tab is selected", () => {
    const session = openTab(openTab(openTab(emptySession, pr), file), issue);
    expect(keys(session.tabs)).toEqual(["pr:435", "AMA-175"]);
  });
});

describe("seedSession", () => {
  it("opens only the tab the URL names", () => {
    expect(seedSession(issue, "issue:AMA-175")).toEqual({
      tabs: [issue],
      tiles: { kind: "group", id: DOCK_GROUP },
      groupOf: {},
      activeIn: { [DOCK_GROUP]: "issue:AMA-175" },
      active: "issue:AMA-175",
    });
  });

  it("starts empty without a pane", () => {
    expect(seedSession(undefined, undefined)).toEqual(emptySession);
  });
});

describe("splitTab", () => {
  const twoTabs = () => openTab(openTab(emptySession, pr), issue);

  it("splits the dock into a row, with the tab alone in the new group", () => {
    const session = splitTab(twoTabs(), "issue:AMA-175", "right");
    expect(session.tiles).toEqual({
      kind: "split",
      axis: "row",
      ratio: 0.5,
      first: { kind: "group", id: DOCK_GROUP },
      second: { kind: "group", id: "group:1" },
    });
    expect(groupOfTab(session, "issue:AMA-175")).toBe("group:1");
    expect(keys(tabsInGroup(session, DOCK_GROUP))).toEqual(["pr:435"]);
    expect(session.active).toBe("issue:AMA-175");
    expect(focusedGroup(session)).toBe("group:1");
  });

  it("stacks the pair when the split is downward", () => {
    const session = splitTab(twoTabs(), "issue:AMA-175", "bottom");
    expect(session.tiles.kind === "split" && session.tiles.axis).toBe("column");
    expect(session.tiles.kind === "split" && session.tiles.ratio).toBe(0.5);
  });

  it("leaves the group it came from showing the tab that stayed", () => {
    const session = splitTab(twoTabs(), "issue:AMA-175", "right");
    expect(session.activeIn[DOCK_GROUP]).toBe("pr:keyurbodar/kiki#435");
  });

  it("opens a later tab into the group that has focus", () => {
    const session = splitTab(twoTabs(), "issue:AMA-175", "right");
    const next = openTab(session, overview);
    expect(groupOfTab(next, "overview")).toBe("group:1");
    expect(keys(tabsInGroup(next, "group:1"))).toEqual(["AMA-175", "overview"]);
  });

  it("has nothing to split when its group holds only that tab", () => {
    const session = splitTab(twoTabs(), "issue:AMA-175", "right");
    expect(splitTab(session, "issue:AMA-175", "right")).toBe(session);
  });

  it("ignores a tab that is not open", () => {
    expect(splitTab(twoTabs(), "overview", "right")).toEqual(twoTabs());
  });

  it("names each new group after the ones in use", () => {
    const once = splitTab(twoTabs(), "issue:AMA-175", "right");
    const twice = splitTab(openTab(once, overview), "overview", "bottom");
    expect(sessionGroups(twice)).toEqual([DOCK_GROUP, "group:1", "group:2"]);
  });
});

describe("closing one of two panes", () => {
  it("gives the survivor the whole dock", () => {
    const session = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const next = closeTab(session, "issue:AMA-175");
    expect(next.tiles).toEqual({ kind: "group", id: DOCK_GROUP });
    expect(sessionGroups(next)).toEqual([DOCK_GROUP]);
    expect(next.groupOf).toEqual({});
    expect(next.active).toBe("pr:keyurbodar/kiki#435");
    expect(keys(next.tabs)).toEqual(["pr:435"]);
  });

  it("collapses only the split the empty group was in", () => {
    const first = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const second = splitTab(openTab(first, overview), "overview", "bottom");
    expect(sessionGroups(second)).toEqual([DOCK_GROUP, "group:1", "group:2"]);
    const next = closeTab(second, "issue:AMA-175");
    expect(sessionGroups(next)).toEqual([DOCK_GROUP, "group:2"]);
    expect(
      next.tiles.kind === "split" && next.tiles.first.kind === "group",
    ).toBe(true);
  });

  it("keeps the other pane whole when the dock's own group empties", () => {
    const session = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const next = closeTab(session, "pr:keyurbodar/kiki#435");
    const open = (group: string) => tabsInGroup(next, group).length > 0;
    expect(layoutTiles(next.tiles, open).leaves).toEqual([
      { id: "group:1", rect: fullTileRect },
    ]);
    expect(next.active).toBe("issue:AMA-175");
  });
});

describe("moveTab", () => {
  it("takes the tab out of the group it was in and empty that group", () => {
    const session = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const next = moveTab(session, "issue:AMA-175", DOCK_GROUP);
    expect(sessionGroups(next)).toEqual([DOCK_GROUP]);
    expect(groupOfTab(next, "issue:AMA-175")).toBe(DOCK_GROUP);
    expect(keys(tabsInGroup(next, DOCK_GROUP))).toEqual(["pr:435", "AMA-175"]);
  });

  it("moves a tab into a group that already holds one", () => {
    const split = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const session = openTab(split, { kind: "files" });
    const next = moveTab(session, "files", DOCK_GROUP);
    expect(keys(tabsInGroup(next, DOCK_GROUP))).toEqual(["pr:435", "files"]);
    expect(next.active).toBe("files");
    expect(next.activeIn[DOCK_GROUP]).toBe("files");
  });

  it("ignores a group that is not in the dock", () => {
    const session = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    expect(moveTab(session, "issue:AMA-175", "group:9")).toBe(session);
  });
});

describe("setGroupRatio", () => {
  it("moves the divider and keeps the tree when it does not move", () => {
    const session = splitTab(
      openTab(openTab(emptySession, pr), issue),
      "issue:AMA-175",
      "right",
    );
    const moved = setGroupRatio(session, "", 0.3);
    expect(moved.tiles.kind === "split" && moved.tiles.ratio).toBe(0.3);
    expect(setGroupRatio(moved, "", 0.3)).toBe(moved);
    expect(setGroupRatio(session, "", 0.02).tiles.kind === "split").toBe(true);
  });
});
