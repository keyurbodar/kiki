import { describe, expect, it } from "vitest";
import {
  buildSearchResults,
  type CommandMenuSearchData,
  emptySearchData,
  filterChoices,
  filterSuggestions,
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

const filtered: CommandMenuSearchData = {
  ...emptySearchData,
  captains: [
    { id: "cap-nav", name: "Navigator", updatedAt: now - hour },
    { id: "cap-old", name: "Ancient", updatedAt: now - 200 * hour },
  ],
  threads: [
    {
      id: "t-sam",
      title: "Wire the retries",
      status: "working",
      updatedAt: now - hour,
      author: "Sam Rivera",
      labels: ["release"],
    },
    {
      id: "t-priya",
      title: "Shard the suite",
      status: "waiting",
      updatedAt: now - 100 * hour,
      author: "Priya Shah",
      labels: [],
    },
  ],
  pulls: [
    {
      id: "p-capy",
      number: 12,
      title: "Skip the retry cap",
      repo: "scrapybara/capy",
      author: "Sam Rivera",
      state: "draft",
      updatedAt: now - 2 * hour,
    },
  ],
  commands: [command("go-threads", "navigation", "Go to threads")],
};

const ids = (results: ReturnType<typeof buildSearchResults>) =>
  results.groups.flatMap((group) => group.items.map((item) => item.id));

describe("typed operators", () => {
  it("splits key:value words off the free text", () => {
    const parsed = parseQuery("author:sam retries", "all");
    expect(parsed.tokens).toEqual([{ key: "author", values: ["sam"] }]);
    expect(parsed.term).toBe("retries");
    expect(parseQuery("author:a,b ", "all").tokens).toEqual([
      { key: "author", values: ["a", "b"] },
    ]);
    // The word the caret is still in stays active rather than committed.
    expect(parseQuery("author:a,b", "all").tokens).toEqual([]);
  });

  it("keeps the actions prefix out of the tokens", () => {
    const parsed = parseQuery(">author:sam", "all");
    expect(parsed.category).toBe("actions");
    expect(parsed.tokens).toEqual([]);
  });

  it("narrows threads, pulls and captains by author", () => {
    const results = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "author", values: ["priya"] }],
      now,
    });
    expect(ids(results)).toEqual(["t-priya"]);
    expect(results.groups.map((group) => group.kind)).toEqual(["threads"]);
  });

  it("filters by label, status, repo and captain", () => {
    const byLabel = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "label", values: ["release"] }],
      now,
    });
    expect(ids(byLabel)).toEqual(["t-sam"]);
    const byStatus = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "status", values: ["draft"] }],
      now,
    });
    expect(ids(byStatus)).toEqual(["p-capy"]);
    const byRepo = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "repo", values: ["scrapybara/capy"] }],
      now,
    });
    expect(ids(byRepo)).toEqual(["p-capy"]);
    const byCaptain = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "captain", values: ["navigator"] }],
      now,
    });
    expect(ids(byCaptain)).toEqual(["cap-nav"]);
  });

  it("filters by a since window", () => {
    const results = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "since", values: ["week"] }],
      now,
    });
    expect(ids(results)).toEqual(["cap-nav", "t-sam", "t-priya", "p-capy"]);
  });

  it("still reports a token that matches nothing, so it can be removed alone", () => {
    const results = buildSearchResults("", "all", filtered, {
      tokens: [{ key: "author", values: ["nobody"] }],
      now,
    });
    expect(results.total).toBe(0);
    expect(results.parsed.tokens).toEqual([
      { key: "author", values: ["nobody"] },
    ]);
    expect(results.compose).toBe(false);
  });
});

describe("filter suggestions", () => {
  it("offers keys once the prefix is two characters", () => {
    const rows = filterSuggestions(
      { kind: "key", prefix: "s", start: 0, end: 1 },
      filtered,
    );
    expect(rows).toEqual([]);
    const named = filterSuggestions(
      { kind: "key", prefix: "au", start: 0, end: 2 },
      filtered,
    );
    expect(named.map((row) => [row.group, row.label, row.value])).toEqual([
      ["Filter by", "author:", "author"],
    ]);
  });

  it("lists the values the palette holds, with a raw row for a value it does not", () => {
    const rows = filterSuggestions(
      {
        kind: "value",
        key: "author",
        values: [],
        partial: "sa",
        start: 7,
        end: 10,
      },
      filtered,
    );
    expect(rows.map((row) => row.value)).toEqual(["Sam Rivera", "sa"]);
    const raw = filterSuggestions(
      {
        kind: "value",
        key: "label",
        values: [],
        partial: "hotfix",
        start: 6,
        end: 12,
      },
      filtered,
    );
    expect(raw.map((row) => row.value)).toEqual(["hotfix"]);
  });

  it("stays quiet about a key the palette cannot fill", () => {
    const rows = filterSuggestions(
      { kind: "key", prefix: "re", start: 0, end: 2 },
      { ...filtered, pulls: [] },
    );
    expect(rows).toEqual([]);
    expect(
      filterSuggestions(
        { kind: "key", prefix: "re", start: 0, end: 2 },
        filtered,
      ).map((row) => row.value),
    ).toEqual(["repo"]);
  });

  it("reads its choices from the rows it is holding", () => {
    expect(filterChoices("repo", filtered)).toEqual(["scrapybara/capy"]);
    expect(filterChoices("since", filtered)).toEqual([
      "today",
      "week",
      "month",
    ]);
  });
});
