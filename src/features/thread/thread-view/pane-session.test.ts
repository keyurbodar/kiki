import { describe, expect, it } from "vitest";
import type { PaneTab } from "@/features/thread-panes/tab-strip";
import {
  closeTab,
  emptySession,
  isTransientTab,
  openTab,
  seedSession,
  selectTab,
  setTabFocus,
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
      active: "issue:AMA-175",
    });
  });

  it("starts empty without a pane", () => {
    expect(seedSession(undefined, undefined)).toEqual(emptySession);
  });
});
