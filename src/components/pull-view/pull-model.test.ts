import { describe, expect, it } from "vitest";
import {
  checksSummary,
  checkVerdict,
  hasDiffBreakdown,
  relativeTime,
  rollupVerdict,
  sortChecks,
  toCheckRows,
  toPull,
  toReviewers,
  visibleDiffCounts,
} from "./pull-model";

describe("toPull", () => {
  it("reads Capy fields and mock fallbacks", () => {
    const pull = toPull({
      id: "pr_1",
      repoFullName: "acme/web",
      number: 7,
      title: "Add a toggle",
      state: "ready",
      authorLogin: "alex-sample",
      updatedAt: "2026-01-02T00:00:00.000Z",
      headRef: "feat/toggle",
      baseRef: "main",
      body: "Body text",
      issues: [{ id: "i1", code: "ACME-1", title: "Toggle" }],
    });
    expect(pull).toMatchObject({
      repo: "acme/web",
      author: "alex-sample",
      bodyMd: "Body text",
      state: "ready",
      url: "https://github.com/acme/web/pull/7",
      issues: [{ code: "ACME-1" }],
    });
    expect(pull?.createdAt.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });

  it("derives merged and draft states", () => {
    expect(
      toPull({ id: "a", repo: "r/x", mergedAt: "2026-01-01" })?.state,
    ).toBe("merged");
    expect(toPull({ id: "a", repo: "r/x", draft: true })?.state).toBe("draft");
    expect(toPull({ repo: "r/x" })).toBeUndefined();
  });
});

describe("checks", () => {
  const rows = toCheckRows([
    { name: "b", status: "completed", conclusion: "success" },
    { name: "a", status: "in_progress", conclusion: null },
    { name: "c", conclusion: "timed_out" },
    { name: "d", conclusion: "skipped" },
    { kind: "status", name: "e", state: "error" },
    { conclusion: "success" },
  ]);

  it("classifies each row", () => {
    expect(rows.map(checkVerdict)).toEqual([
      "success",
      "pending",
      "failure",
      "neutral",
      "failure",
    ]);
  });

  it("summarises and sorts failures first", () => {
    expect(checksSummary(rows)).toBe(
      "2 failed, 1 running, 1 passed, 1 skipped",
    );
    expect(checksSummary([])).toBe("No checks yet");
    expect(sortChecks(rows).map((row) => row.name)).toEqual([
      "c",
      "e",
      "a",
      "d",
      "b",
    ]);
    expect(rollupVerdict(rows)).toBe("failure");
    expect(rollupVerdict(rows.slice(0, 1))).toBe("success");
  });
});

describe("relativeTime", () => {
  const now = Date.UTC(2026, 0, 10);
  it("formats past and future spans", () => {
    expect(relativeTime(now - 2000, { now })).toBe("just now");
    expect(relativeTime(now - 20 * 3600 * 1000, { now })).toBe("20h ago");
    expect(relativeTime(now + 3 * 86400 * 1000, { now })).toBe("in 3d");
    expect(relativeTime(now - 90 * 1000, { now, minified: true })).toBe("1m");
  });
});

describe("diff counts", () => {
  const breakdown = {
    database: { files: 0, additions: 0, deletions: 0 },
    tests: { files: 2, additions: 32, deletions: 2 },
    generated: { files: 0, additions: 0, deletions: 0 },
  };
  it("hides categorised lines from the headline", () => {
    expect(visibleDiffCounts(57, 21, breakdown)).toEqual({
      additions: 25,
      deletions: 19,
    });
    expect(visibleDiffCounts(5, 1, null)).toEqual({
      additions: 5,
      deletions: 1,
    });
    expect(hasDiffBreakdown(breakdown)).toBe(true);
    expect(hasDiffBreakdown(null)).toBe(false);
  });
});

describe("toReviewers", () => {
  it("maps approval to a review state", () => {
    expect(
      toReviewers([
        { login: "a", approved: true },
        { login: "b", name: "Bee" },
        { name: "nobody" },
      ]),
    ).toEqual([
      { login: "a", name: null, avatarUrl: null, state: "approved" },
      { login: "b", name: "Bee", avatarUrl: null, state: null },
    ]);
  });
});
