import { describe, expect, it } from "vitest";
import { toListQuery } from "./data/atoms";
import {
  decodeBranches,
  decodeInstallationRepos,
  decodePullPage,
  type PullCard,
} from "./data/pull";
import {
  activeViewKey,
  buildSections,
  defaultPrefs,
  emptyFilters,
  emptyText,
  matchesFilters,
  pullCode,
  sameFilters,
  setNegative,
  shortAge,
  summarize,
  toListRequest,
} from "./model";

const now = Date.parse("2026-03-10T12:00:00Z");
const hour = 60 * 60 * 1000;

const pull = (overrides: Partial<PullCard>): PullCard => ({
  id: "pr_1",
  projectId: null,
  repo: "acme/web",
  number: 1,
  title: "Sample change",
  state: "ready",
  checksState: "passed",
  additions: 1,
  deletions: 0,
  author: "sam",
  authorAvatarUrl: "",
  url: "https://github.com/acme/web/pull/1",
  headRef: "feat/sample",
  baseRef: "main",
  threadId: null,
  thread: null,
  createdAt: now - 48 * hour,
  updatedAt: now - hour,
  ...overrides,
});

describe("pull decoders", () => {
  it("reads a PullRequestPage and a bare detail array", () => {
    const card = {
      id: "pr_a",
      repo: "acme/web",
      number: 3,
      state: "draft",
      author: "sam",
      updatedAt: "2026-03-10T11:00:00Z",
    };
    expect(decodePullPage({ items: [card], cursor: "c" }).items[0]?.state).toBe(
      "draft",
    );
    expect(decodePullPage({ items: [card], cursor: "c" }).cursor).toBe("c");
    const detail = {
      id: "pr_b",
      repoFullName: "acme/api",
      number: 4,
      state: "merged",
      authorLogin: "alex",
    };
    expect(decodePullPage([detail, { nope: true }]).items).toMatchObject([
      { id: "pr_b", repo: "acme/api", author: "alex", state: "merged" },
    ]);
  });

  it("reads installation repos and branches in either shape", () => {
    expect(
      decodeInstallationRepos({
        state: "ok",
        repos: [
          { repoFullName: "acme/web", defaultBranch: "main", archived: false },
          { repoFullName: "acme/old", archived: true },
        ],
      }),
    ).toEqual([{ fullName: "acme/web", defaultBranch: "main" }]);
    expect(
      decodeInstallationRepos([{ fullName: "acme/api", defaultBranch: null }]),
    ).toEqual([{ fullName: "acme/api", defaultBranch: null }]);
    expect(decodeBranches(["main", "dev"], "acme/web")).toEqual([
      "main",
      "dev",
    ]);
    expect(
      decodeBranches(
        [
          { name: "a", repo: "acme/web" },
          { name: "b", repo: "acme/api" },
        ],
        "acme/web",
      ),
    ).toEqual(["a"]);
  });
});

describe("pull filters", () => {
  it("splits negative axes into excluded server params", () => {
    const filters = setNegative(
      { ...emptyFilters, states: ["merged"], projects: ["p1"] },
      "projects",
      true,
    );
    const request = toListRequest(filters, "", now, 50);
    expect(request.states).toEqual(["merged"]);
    expect(request.projectIds).toEqual([]);
    expect(request.excludedProjectIds).toEqual(["p1"]);
    expect(toListQuery(request)).toEqual({
      limit: "50",
      state: ["merged"],
      excludedProjectIds: ["p1"],
    });
  });

  it("drops the tab's state filter while a search is active", () => {
    const filters = { ...emptyFilters, states: ["merged"] as const };
    expect(toListRequest(filters, "", now, 50).states).toEqual(["merged"]);
    expect(toListRequest(filters, "dark mode", now, 50).states).toEqual([]);
    expect(toListRequest(filters, "dark mode", now, 50).excludedStates).toEqual(
      [],
    );
  });

  it("sends since as updatedAfter only for a positive preset", () => {
    expect(
      toListRequest({ ...emptyFilters, updated: "week" }, "", now, 50)
        .updatedAfter,
    ).toBeLessThan(now);
    expect(
      toListRequest({ ...emptyFilters, updated: "older" }, "", now, 50)
        .updatedAfter,
    ).toBeNull();
  });

  it("matches states, authors, thread and dates with negation", () => {
    const linked = pull({ threadId: "jam_1" });
    expect(
      matchesFilters(linked, { ...emptyFilters, states: ["ready"] }, now),
    ).toBe(true);
    expect(
      matchesFilters(
        linked,
        setNegative({ ...emptyFilters, states: ["ready"] }, "states", true),
        now,
      ),
    ).toBe(false);
    expect(
      matchesFilters(linked, { ...emptyFilters, authors: ["alex"] }, now),
    ).toBe(false);
    expect(
      matchesFilters(linked, { ...emptyFilters, thread: "none" }, now),
    ).toBe(false);
    expect(
      matchesFilters(
        linked,
        setNegative({ ...emptyFilters, thread: "none" }, "thread", true),
        now,
      ),
    ).toBe(true);
    expect(
      matchesFilters(linked, { ...emptyFilters, updated: "today" }, now),
    ).toBe(true);
    expect(
      matchesFilters(linked, { ...emptyFilters, created: "older" }, now),
    ).toBe(false);
  });

  it("treats filters as equal regardless of order and unused negations", () => {
    const a = { ...emptyFilters, states: ["ready", "draft"] as const };
    const b = setNegative(
      { ...emptyFilters, states: ["draft", "ready"] as const },
      "repos",
      true,
    );
    expect(sameFilters(a, b)).toBe(true);
    expect(activeViewKey(defaultPrefs)).toBe("open");
  });
});

describe("pull sections", () => {
  const pulls = [
    pull({ id: "a", state: "ready" }),
    pull({ id: "b", state: "failed", repo: "acme/api", author: "alex" }),
    pull({ id: "c", state: "merged" }),
  ];

  it("groups by state in Capy's order, pinned first, hiding empty sections", () => {
    const sections = buildSections(
      pulls,
      { ...defaultPrefs, filters: emptyFilters, pinned: ["c"] },
      false,
      now,
    );
    expect(sections.map((section) => section.id)).toEqual([
      "pinned",
      "ready",
      "failed",
    ]);
  });

  it("shows empty sections for the filtered states when asked", () => {
    const sections = buildSections(
      pulls,
      { ...defaultPrefs, showEmptySections: true },
      false,
      now,
    );
    expect(sections.map((section) => section.id)).toEqual([
      "ready",
      "failed",
      "pending",
      "draft",
    ]);
  });

  it("drops pulls without a project when a project filter is on", () => {
    const unassigned = pull({ id: "u", projectId: null });
    const assigned = pull({ id: "a", projectId: "p1" });
    const filters = { ...emptyFilters, projects: ["p1"] };
    expect(matchesFilters(unassigned, filters, now)).toBe(false);
    expect(matchesFilters(assigned, filters, now)).toBe(true);
    expect(
      matchesFilters(unassigned, setNegative(filters, "projects", true), now),
    ).toBe(true);
  });

  it("keeps same-named repositories apart and labels them by owner", () => {
    const sections = buildSections(
      [
        pull({ id: "a", repo: "acme/web" }),
        pull({ id: "b", repo: "partner/web" }),
      ],
      { ...defaultPrefs, filters: emptyFilters, grouping: "repo" },
      false,
      now,
    );
    expect(sections.map((section) => section.label)).toEqual([
      "acme/web",
      "partner/web",
    ]);
  });

  it("groups by repository and author", () => {
    const byRepo = buildSections(
      pulls,
      { ...defaultPrefs, filters: emptyFilters, grouping: "repo" },
      false,
      now,
    );
    expect(byRepo.map((section) => section.label)).toEqual(["api", "web"]);
    const byAuthor = buildSections(
      pulls,
      { ...defaultPrefs, filters: emptyFilters, grouping: "author" },
      false,
      now,
    );
    expect(byAuthor.map((section) => section.label)).toEqual(["alex", "sam"]);
  });
});

describe("pull labels", () => {
  it("formats codes, summaries, ages and empty copy", () => {
    expect(pullCode(pull({ number: 12 }))).toBe("#12");
    expect(summarize(["Ready", "Draft"], "states")).toBe("Ready, Draft");
    expect(summarize(["a", "b", "c", "d"], "states")).toBe("4 states");
    expect(shortAge(now - 5 * 60 * 1000, now)).toBe("5m");
    expect(shortAge(now - 3 * hour, now)).toBe("3h");
    expect(shortAge(now - 15 * 24 * hour, now)).toBe("2w");
    expect(emptyText(false, 0, false)).toBe("No pull requests yet");
    expect(emptyText(false, 3, true)).toBe(
      "No pull requests match these filters",
    );
    expect(emptyText(true, 3, false)).toBe("No matching pull requests");
    expect(emptyText(false, 0, false, true)).toBe("No open pull requests");
    expect(emptyText(false, 0, false, false)).toBe("No pull requests yet");
    expect(emptyText(false, 0, true, true)).toBe(
      "No pull requests match these filters",
    );
  });
});
