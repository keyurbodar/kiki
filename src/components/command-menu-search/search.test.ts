import { describe, expect, it } from "vitest";
import {
  buildSearchResults,
  type CommandMenuSearchData,
  emptySearchData,
  footerModeFor,
  formatAge,
  type PaletteCommand,
  parseQuery,
  stepCategory,
  stripActionsPrefix,
} from "./search";

const now = 1_000_000_000;
const hour = 3_600_000;
const noop = () => undefined;

const command = (
  id: string,
  kind: PaletteCommand["kind"],
  title: string,
): PaletteCommand => ({
  id,
  kind,
  icon: "pin",
  title,
  searchTerms: [title.toLowerCase()],
  run: noop,
});

const data: CommandMenuSearchData = {
  ...emptySearchData,
  captains: [
    { id: "a", name: "Older", updatedAt: now - 5 * hour },
    { id: "b", name: "Newer", updatedAt: now - hour },
  ],
  threads: [
    { id: "t1", title: "Idle thread", status: "idle", updatedAt: now - hour },
    {
      id: "t2",
      title: "Working thread",
      status: "working",
      updatedAt: now - 9 * hour,
    },
    {
      id: "t3",
      title: "Archived thread",
      status: "archived",
      archived: true,
      updatedAt: now,
    },
  ],
  pulls: [
    {
      id: "p1",
      number: 7,
      title: "Fix the theme",
      repo: "o/r",
      author: "x",
      state: "open",
      updatedAt: now,
    },
  ],
  automations: [{ id: "u1", name: "Nightly check", enabled: true }],
  commands: [
    command("go-threads", "navigation", "Go to threads"),
    command("shortcut-thread.new", "action", "New thread"),
    command("theme-dark", "appearance", "Switch to dark mode"),
    command("docs", "account", "Documentation"),
  ],
  currentThread: {
    thread: { id: "t1", title: "Idle thread", status: "idle", updatedAt: now },
    commands: [command("thread-pin", "threadAction", "Pin thread")],
  },
};

const keys = (query: string, category = "all" as const) =>
  buildSearchResults(query, category, data).groups.map((group) => group.key);

describe("categories", () => {
  it("wraps when stepping past either end", () => {
    expect(stepCategory("all", -1)).toBe("settings");
    expect(stepCategory("settings", 1)).toBe("all");
    expect(stepCategory("threads", 1)).toBe("pulls");
  });
});

describe("parseQuery", () => {
  it("treats a leading > as the actions category", () => {
    expect(parseQuery("  > Pin", "threads")).toMatchObject({
      actionsPrefix: true,
      category: "actions",
      term: "pin",
    });
    expect(stripActionsPrefix(" > pin")).toBe("pin");
  });
});

describe("buildSearchResults", () => {
  it("shows captains, this thread, recent threads and the rest when idle", () => {
    expect(keys("")).toEqual([
      "captains",
      "this_thread",
      "threads",
      "actions",
      "navigation",
      "appearance",
    ]);
    const results = buildSearchResults("", "all", data);
    const threads = results.groups.find((group) => group.key === "threads");
    expect(threads?.label).toBe("Recent threads");
    expect(threads?.items.map((item) => item.id)).toEqual(["t2", "t1"]);
    const captains = results.groups.find((group) => group.key === "captains");
    expect(captains?.items.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("limits a category to its own kinds", () => {
    expect(keys("", "actions" as never)).toEqual([
      "this_thread",
      "actions",
      "navigation",
      "appearance",
      "account",
    ]);
    expect(keys("", "automations" as never)).toEqual(["automations"]);
  });

  it("asks for a query before searching pull requests", () => {
    const results = buildSearchResults("", "pulls", data);
    expect(results.groups).toEqual([]);
    expect(results.emptyText).toBe("Type to search pull requests");
    expect(buildSearchResults("theme", "pulls", data).groups[0]?.key).toBe(
      "pulls",
    );
  });

  it("offers a new thread when nothing matches", () => {
    const results = buildSearchResults("zzzqqq", "all", data);
    expect(results.total).toBe(0);
    expect(results.compose).toBe(true);
    expect(buildSearchResults("zzzqqq", "captains", data).compose).toBe(false);
  });

  it("sorts groups by their best match", () => {
    expect(keys("documentation")[0]).toBe("account");
  });
});

describe("footerModeFor", () => {
  const results = buildSearchResults("", "all", data);
  it("tells threads, openable rows and commands apart", () => {
    expect(footerModeFor("thread-t1", results)).toBe("thread");
    expect(footerModeFor("captain-a", results)).toBe("openable");
    expect(footerModeFor("thread-pin", results)).toBe("select");
    expect(footerModeFor(undefined, results)).toBe("select");
  });
});

describe("formatAge", () => {
  it("prints the minified age", () => {
    expect(formatAge(now, now)).toBe("now");
    expect(formatAge(now - 11 * hour, now)).toBe("11h");
    expect(formatAge(now - 30 * hour, now)).toBe("1d");
  });
});
