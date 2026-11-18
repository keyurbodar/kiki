import { describe, expect, it } from "vitest";
import { findPane, keepsPaneParam } from "@/features/thread-panes/thread-pane";
import { formatShortcut } from "./shortcut";
import {
  closeTargets,
  cycleTabId,
  matchesQuery,
  type PaneTab,
  type PaneTabKind,
  type RailTab,
  reorderBefore,
  routablePaneKinds,
  tabKey,
  tabLabel,
  tabLink,
} from "./tabs";

const overview: PaneTab = { kind: "overview" };
const files: PaneTab = { kind: "files" };
const browser: PaneTab = { kind: "browser", id: "b1", url: "", title: "" };

describe("tabKey", () => {
  it("keys scoped tabs by thread and plain tabs by kind", () => {
    expect(tabKey({ kind: "diffs" })).toBe("diffs");
    expect(tabKey({ kind: "diffs", jamId: "jam_2" })).toBe("diffs:jam_2");
    expect(tabKey({ kind: "side_thread", jamId: "jam_3" })).toBe(
      "side-thread:jam_3",
    );
    expect(
      tabKey({
        kind: "pr",
        number: 12,
        url: "https://github.com/acme/web/pull/12",
      }),
    ).toBe("pr:acme/web#12");
    expect(tabKey({ kind: "file", path: "src/a.ts", machineId: "m1" })).toBe(
      "file@m1:::src/a.ts",
    );
  });
});

describe("tabLabel", () => {
  it("uses Capy's default labels", () => {
    expect(tabLabel(overview)).toBe("Overview");
    expect(tabLabel({ kind: "captain_issues" })).toBe("Issues");
    expect(tabLabel(browser)).toBe("New tab");
    expect(tabLabel({ ...browser, url: "https://example.com/docs" })).toBe(
      "example.com",
    );
    expect(tabLabel({ ...browser, url: "not a url" })).toBe("not a url");
    expect(tabLabel({ kind: "task", jamId: "j", localIndex: 2 })).toBe(
      "Subagent 2",
    );
    expect(tabLabel({ kind: "desktop", jamId: "j", localIndex: null })).toBe(
      "Desktop",
    );
    expect(tabLabel({ kind: "drive_file", path: "notes/plan.md" })).toBe(
      "plan.md",
    );
  });
});

describe("matchesQuery", () => {
  it("matches any field case-insensitively and everything when empty", () => {
    expect(matchesQuery("", "Overview")).toBe(true);
    expect(matchesQuery("  VIEW ", "Overview")).toBe(true);
    expect(matchesQuery("drive", "Files", undefined, "Drive")).toBe(true);
    expect(matchesQuery("zzz", "Files")).toBe(false);
  });
});

const rail: RailTab[] = [
  { id: "chat", tab: undefined },
  { id: "overview", tab: overview },
  { id: "files", tab: files },
  { id: "browser:b1", tab: browser },
];

describe("cycleTabId", () => {
  it("steps and wraps around the strip", () => {
    expect(cycleTabId(rail, "overview", 1)).toBe("files");
    expect(cycleTabId(rail, "chat", -1)).toBe("browser:b1");
    expect(cycleTabId(rail, "browser:b1", 1)).toBe("chat");
  });

  it("does nothing on a single tab", () => {
    expect(cycleTabId(rail.slice(0, 1), "chat", 1)).toBeUndefined();
  });
});

describe("closeTargets", () => {
  it("never closes the pinned chat tab", () => {
    const targets = closeTargets(rail, "files");
    expect(targets.closable).toEqual(["overview", "files", "browser:b1"]);
    expect(targets.others).toEqual(["overview", "browser:b1"]);
    expect(targets.toRight).toEqual(["browser:b1"]);
  });

  it("has no target on the strip background", () => {
    const targets = closeTargets(rail, null);
    expect(targets.target).toBeUndefined();
    expect(targets.toRight).toEqual([]);
  });
});

describe("reorderBefore", () => {
  const ids = ["a", "b", "c", "d"];
  it("returns the id the dragged tab now precedes", () => {
    expect(reorderBefore(ids, "a", "c")).toBe("d");
    expect(reorderBefore(ids, "d", "b")).toBe("b");
    expect(reorderBefore(ids, "a", "d")).toBeUndefined();
  });

  it("ignores drops in place or outside the strip", () => {
    expect(reorderBefore(ids, "b", "b")).toBeNull();
    expect(reorderBefore(ids, "b", "zz")).toBeNull();
  });
});

describe("tabLink", () => {
  it("links a routable pane by its bare id and the chat tab to the thread", () => {
    expect(tabLink("jam_1", undefined)).toBe("/thread/jam_1");
    expect(tabLink("jam_1", { kind: "diffs", jamId: "jam_2" })).toBe(
      "/thread/jam_1?pane=diffs",
    );
    expect(tabLink("jam_1", { kind: "overview" })).toBe(
      "/thread/jam_1?pane=overview",
    );
  });

  it("links a tab that names another thread to that thread", () => {
    expect(
      tabLink("jam_1", { kind: "task", jamId: "jam_2", localIndex: null }),
    ).toBe("/thread/jam_2");
    expect(tabLink("jam_1", { kind: "side_thread", jamId: "jam_3" })).toBe(
      "/thread/jam_3",
    );
  });

  it("links a parameterised tab with no pane and no thread to the thread", () => {
    expect(
      tabLink("jam_1", {
        kind: "browser",
        id: "b1",
        url: "https://example.test",
        title: "Example",
      }),
    ).toBe("/thread/jam_1");
    expect(
      tabLink("jam_1", {
        kind: "shell",
        machineId: "m1",
        clientId: "c1",
        label: "zsh",
      }),
    ).toBe("/thread/jam_1");
  });

  it("only emits pane params the thread route can resolve", () => {
    expect(routablePaneKinds).toEqual([
      "overview",
      "diffs",
      "files",
      "captain_issues",
    ]);
    const samples: ReadonlyArray<[PaneTabKind, PaneTab]> = [
      ["overview", { kind: "overview" }],
      ["diffs", { kind: "diffs", jamId: "jam_2" }],
      ["files", { kind: "files", jamId: "jam_2" }],
      ["captain_issues", { kind: "captain_issues" }],
    ];
    for (const [kind, tab] of samples) {
      const link = tabLink("jam_1", tab);
      const param = new URL(link, "https://capy.test").searchParams.get("pane");
      expect(param).toBe(kind);
      expect(findPane(param ?? undefined)?.id).toBe(kind);
      // `files` is readable but not written: Capy opens the pane and rewrites the
      // param off the URL, so the route keeps the pane and drops the param.
      if (kind !== "files") {
        expect(keepsPaneParam(param ?? undefined)).toBe(true);
      }
    }
  });
});

describe("formatShortcut", () => {
  it("prints mac glyphs in Capy's modifier order", () => {
    expect(formatShortcut("mod+shift+l", true)).toBe("⇧⌘L");
    expect(formatShortcut("ctrl+shift+`", true)).toBe("⌃⇧`");
    expect(formatShortcut("mod+alt+shift+arrowleft", true)).toBe("⌥⇧⌘←");
  });

  it("spells modifiers out elsewhere", () => {
    expect(formatShortcut("mod+shift+g", false)).toBe("Ctrl+Shift+G");
    expect(formatShortcut("mod+w", false)).toBe("Ctrl+W");
  });
});
