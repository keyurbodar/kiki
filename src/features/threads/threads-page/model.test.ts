import { describe, expect, it } from "vitest";
import {
  activeViewKey,
  buildSections,
  defaultThreadFilters,
  defaultThreadsPageState,
  emptyText,
  filterThreads,
  formatAge,
  sameFilters,
  type ThreadListItem,
  threadCode,
  threadFilterChips,
  threadShelf,
} from "./model";

const now = new Date(2026, 10, 17, 12).getTime();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000);

const thread = (overrides: Partial<ThreadListItem> = {}): ThreadListItem => ({
  id: "jam_1",
  title: "Fix the flaky test",
  status: "idle",
  archived: false,
  archivedIdleDays: null,
  threadNumber: 4,
  userId: "user_me",
  participated: true,
  origin: "web",
  projectId: "proj_web",
  pinned: false,
  needsYou: false,
  hasUnreads: false,
  personal: false,
  lastModelId: null,
  pulls: [],
  createdAt: minutesAgo(120),
  sortActivityAt: minutesAgo(30),
  lastActivityAt: minutesAgo(30),
  settledAt: null,
  automationName: null,
  automationId: null,
  captain: null,
  ...overrides,
});

const projects = new Map([
  ["proj_web", { id: "proj_web", name: "Web", code: "WEB" }],
]);

describe("threads page model", () => {
  it("formats codes and ages like Capy", () => {
    expect(threadCode(thread(), projects)).toBe("WEB-4");
    expect(threadCode(thread({ projectId: null }), projects)).toBe("#4");
    expect(threadCode(thread({ threadNumber: null }), projects)).toBeNull();
    expect(formatAge(minutesAgo(60 * 26), { now, minified: true })).toBe("1d");
    expect(formatAge(minutesAgo(60 * 19), { now, minified: true })).toBe("19h");
    expect(formatAge(new Date(now - 2000), { now })).toBe("just now");
    expect(formatAge(minutesAgo(3), { now })).toBe("3m ago");
  });

  it("matches the built-in views and treats edits as dirty", () => {
    expect(activeViewKey(defaultThreadsPageState)).toBe("my");
    const all = {
      ...defaultThreadsPageState,
      filters: { ...defaultThreadFilters, participants: [] },
    };
    expect(activeViewKey(all)).toBe("all");
    const edited = {
      ...defaultThreadsPageState,
      filters: { ...defaultThreadFilters, projects: ["proj_web"] },
    };
    expect(activeViewKey(edited)).toBeUndefined();
    expect(
      sameFilters(
        { ...defaultThreadFilters, negativeAxes: ["projects"] },
        defaultThreadFilters,
      ),
    ).toBe(true);
  });

  it("filters to my threads and hides automation runs by default", () => {
    const threads = [
      thread({ id: "a" }),
      thread({ id: "b", userId: "user_other", participated: false }),
      thread({ id: "c", automationName: "Nightly check" }),
      thread({ id: "d", archived: true }),
    ];
    expect(
      filterThreads(threads, defaultThreadFilters, "user_me", now).map(
        (t) => t.id,
      ),
    ).toEqual(["a"]);
    const everyone = { ...defaultThreadFilters, participants: [] };
    expect(
      filterThreads(threads, everyone, "user_me", now).map((t) => t.id),
    ).toEqual(["a", "b"]);
    const archived = {
      ...defaultThreadFilters,
      archived: "only" as const,
      participants: [],
    };
    expect(
      filterThreads(threads, archived, "user_me", now).map((t) => t.id),
    ).toEqual(["d"]);
    const notWeb = {
      ...everyone,
      projects: ["proj_web"],
      negativeAxes: ["projects"],
    };
    expect(filterThreads(threads, notWeb, "user_me", now)).toEqual([]);
  });

  it("puts threads on Capy's shelves", () => {
    expect(threadShelf(thread({ needsYou: true }), now)).toBe("asks");
    expect(threadShelf(thread({ status: "working" }), now)).toBe("working");
    expect(
      threadShelf(
        thread({
          sortActivityAt: minutesAgo(60 * 24 * 8),
          lastActivityAt: null,
        }),
        now,
      ),
    ).toBe("settled");
    expect(threadShelf(thread(), now)).toBe("returned");
  });

  it("builds captain and shelf sections; working starts collapsed", () => {
    const sections = buildSections({
      threads: [
        thread({
          id: "cap",
          captain: { name: "Release captain", avatarUrl: null },
        }),
        thread({ id: "w", status: "working" }),
        thread({ id: "r" }),
      ],
      filters: defaultThreadFilters,
      grouping: "none",
      ordering: "updated",
      searching: false,
      now,
      projectName: () => "",
      authorName: () => "",
    });
    expect(sections.map((s) => [s.id, s.members.length])).toEqual([
      ["captains", 1],
      ["all", 1],
      ["closed:shelf:working", 1],
    ]);
  });

  it("shows the default chips and picks empty copy", () => {
    const chips = threadFilterChips(defaultThreadFilters, () => {}, {
      member: (id) => id,
      project: (id) => id,
      automation: (id) => id,
      dateRange: () => "",
    });
    expect(chips.map((chip) => [chip.property, chip.value])).toEqual([
      ["Participants", "Me"],
      ["Automations", "Hidden"],
    ]);
    expect(
      emptyText({
        failed: false,
        searching: false,
        filters: defaultThreadFilters,
      }),
    ).toBe("No threads yet");
    expect(
      emptyText({
        failed: false,
        searching: false,
        filters: { ...defaultThreadFilters, projects: ["x"] },
      }),
    ).toBe("No threads match these filters");
    expect(
      emptyText({
        failed: true,
        searching: false,
        filters: defaultThreadFilters,
      }),
    ).toBe("Threads unavailable");
  });

  it("filters automation runs by their automation id", () => {
    const nightly = thread({
      id: "nightly",
      origin: "automation",
      automationName: "Nightly check",
      automationId: "auto_nightly",
    });
    const weekly = thread({
      id: "weekly",
      origin: "automation",
      automationName: "Weekly report",
      automationId: "auto_weekly",
    });
    const web = thread({ id: "web" });
    const all = [nightly, weekly, web];
    const ids = (filters: Partial<typeof defaultThreadFilters>) =>
      filterThreads(
        all,
        { ...defaultThreadFilters, participants: [], ...filters },
        "user_me",
        now,
      ).map((item) => item.id);
    expect(ids({ automations: ["auto_nightly"] })).toEqual(["nightly"]);
    expect(
      ids({ origins: ["automation"], automations: ["auto_nightly"] }),
    ).toEqual(["nightly"]);
    expect(ids({ origins: ["automation"] })).toEqual(["nightly", "weekly"]);
    expect(ids({ origins: ["web"], automations: ["auto_weekly"] })).toEqual([
      "weekly",
      "web",
    ]);
  });
});
