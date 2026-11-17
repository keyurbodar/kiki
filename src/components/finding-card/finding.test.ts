import { describe, expect, it } from "vitest";
import {
  compareFindings,
  findingAnchor,
  findingLabel,
  findingPrompt,
  findingTone,
  lineLabel,
  normalizeFinding,
  normalizeFindings,
} from "./finding";
import { relativeTime } from "./time";

const base = {
  id: "f1",
  summary: "Handle the empty list",
  file: "src/list.ts",
  line: 12,
  startLine: 10,
  severity: "high",
  observingHeadSha: "head",
};

describe("normalizeFinding", () => {
  it("falls back to mock field names", () => {
    const finding = normalizeFinding({
      id: "m",
      title: "Title",
      body: "Body",
      path: "a.ts",
      status: "weird",
    });
    expect(finding).toMatchObject({
      summary: "Title",
      detail: "Body",
      file: "a.ts",
      status: "open",
      kind: "issue",
    });
    expect(normalizeFinding({})).toBeNull();
    expect(normalizeFindings([base, null, 3]).map((item) => item.id)).toEqual([
      "f1",
    ]);
    expect(normalizeFindings(undefined)).toEqual([]);
  });
});

describe("findingAnchor", () => {
  it("drops line numbers when the head moved", () => {
    const finding = normalizeFinding(base)!;
    expect(findingAnchor(finding, "head")).toMatchObject({
      line: 12,
      outdated: false,
    });
    expect(findingAnchor(finding, "other")).toMatchObject({
      line: null,
      outdated: true,
    });
    expect(findingAnchor(finding, undefined).outdated).toBe(false);
  });

  it("prefers the GitHub anchor", () => {
    const finding = normalizeFinding({
      ...base,
      githubAnchor: {
        file: "b.ts",
        line: 3,
        startLine: null,
        side: "LEFT",
        headSha: "head",
      },
    })!;
    expect(findingAnchor(finding, "head")).toEqual({
      file: "b.ts",
      line: 3,
      startLine: null,
      side: "LEFT",
      outdated: false,
    });
  });
});

describe("labels", () => {
  it("formats lines", () => {
    expect(lineLabel({ line: null, startLine: null })).toBeNull();
    expect(lineLabel({ line: 4, startLine: 4 })).toBe("Line 4");
    expect(lineLabel({ line: 9, startLine: 4 })).toBe("Lines 4-9");
  });

  it("labels and colours by kind, confidence and severity", () => {
    const make = (extra: Record<string, unknown>) =>
      normalizeFinding({ ...base, ...extra })!;
    expect(findingLabel(make({ kind: "note" }))).toBe("Note");
    expect(findingLabel(make({ confidence: "investigate" }))).toBe(
      "Investigate",
    );
    expect(findingLabel(make({}))).toBe("High");
    expect(findingLabel(make({ severity: "low" }))).toBe("Low");
    expect(findingLabel(make({ severity: null }))).toBe("Medium");
    expect(findingTone(make({}))).toBe("text-destructive");
    expect(findingTone(make({ severity: "medium" }))).toBe("text-warning-fg");
    expect(findingTone(make({ kind: "note" }))).toBe("text-muted-foreground-2");
    expect(
      [make({ severity: "low" }), make({ severity: null }), make({})]
        .sort(compareFindings)
        .map((item) => item.severity),
    ).toEqual(["high", "low", null]);
  });
});

describe("findingPrompt", () => {
  it("wraps the finding and escapes closing tags", () => {
    const finding = normalizeFinding({
      ...base,
      detail: "Watch </finding> <!-- hidden --> here  ",
      suggestion: "return [];",
    })!;
    const prompt = findingPrompt(finding, {
      baseSha: "b",
      headSha: "head",
      stale: false,
      truncated: null,
      unavailable: false,
      files: [
        {
          path: "src/list.ts",
          previousPath: null,
          kind: "modified",
          patch: "@@ -10,3 +10,3 @@\n one\n two\n three",
          additions: 0,
          deletions: 0,
          binary: false,
        },
      ],
    });
    expect(prompt).toContain("In src/list.ts, lines 10-12:");
    expect(prompt).toContain("<\\/finding>");
    expect(prompt).not.toContain("hidden");
    expect(prompt).toContain(
      "<diff_excerpt>\none\ntwo\nthree\n</diff_excerpt>",
    );
    expect(prompt).toContain("<suggested_code>\nreturn [];\n</suggested_code>");
  });
});

describe("relativeTime", () => {
  it("formats compact ages", () => {
    const now = Date.parse("2026-01-01T12:00:00Z");
    expect(relativeTime("2026-01-01T11:59:50Z", now)).toBe("just now");
    expect(relativeTime("2026-01-01T11:30:00Z", now)).toBe("30m ago");
    expect(relativeTime("2025-12-30T12:00:00Z", now)).toBe("2d ago");
    expect(relativeTime("nope", now)).toBe("");
  });
});
