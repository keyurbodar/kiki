import { describe, expect, it } from "vitest";
import { normalizeFinding } from "@/components/finding-card/finding";
import { findingsOnUnchangedFiles, groupFindings } from "./discussions";
import { normalizePullDiff } from "./model";
import { diffNotes, diffRows, fileStats, rowKey } from "./rows";

describe("normalizePullDiff", () => {
  it("reads Capy and mock file shapes", () => {
    const diff = normalizePullDiff({
      baseSha: "a",
      headSha: "b",
      files: [
        {
          path: "a.ts",
          kind: "added",
          patch: "@@ -0,0 +1 @@\n+x",
          additions: 1,
        },
        { path: "b.ts", status: "removed", diff: "@@ -1 +0,0 @@\n-y" },
        { nope: true },
      ],
    });
    expect(
      diff?.files.map((file) => [file.path, file.kind, file.patch !== null]),
    ).toEqual([
      ["a.ts", "added", true],
      ["b.ts", "deleted", true],
    ]);
    expect(normalizePullDiff(null)).toBeNull();
    expect(diff ? diffNotes(diff) : []).toEqual([]);
    expect(diffNotes({ stale: true, truncated: 3 })).toEqual([
      "behind the latest push",
      "some files omitted",
    ]);
  });
});

describe("diffRows", () => {
  it("keeps hunk headers and numbers each side", () => {
    const rows = diffRows(
      "@@ -4,2 +4,2 @@ ctx\n same\n-old\n+new\n@@ -20 +20 @@\n tail",
    );
    expect(
      rows.map((row) =>
        row.type === "hunk"
          ? row.header
          : row.type === "run"
            ? `run:${row.rows.length}`
            : rowKey(row.row),
      ),
    ).toEqual([
      "@@ -4,2 +4,2 @@ ctx",
      "RIGHT:4",
      "LEFT:5",
      "RIGHT:5",
      "@@ -20 +20 @@",
      "RIGHT:20",
    ]);
    expect(
      fileStats([
        { additions: 2, deletions: null },
        { additions: 1, deletions: 4 },
      ]),
    ).toEqual({
      additions: 3,
      deletions: 4,
    });
  });
});

describe("groupFindings", () => {
  const finding = (id: string, extra: Record<string, unknown>) =>
    normalizeFinding({ id, summary: id, observingHeadSha: "h", ...extra })!;

  it("groups by file and line, sorted by severity", () => {
    const grouped = groupFindings(
      [
        finding("low", { file: "a.ts", line: 3, severity: "low" }),
        finding("high", { file: "a.ts", line: 3, severity: "high" }),
        finding("whole", { file: "a.ts" }),
        finding("stale", { file: "b.ts", line: 2, observingHeadSha: "old" }),
      ],
      "h",
    );
    expect(
      grouped
        .get("a.ts")
        ?.lines.get("RIGHT:3")
        ?.map((item) => item.id),
    ).toEqual(["high", "low"]);
    expect(grouped.get("a.ts")?.file.map((item) => item.id)).toEqual(["whole"]);
    expect(grouped.get("b.ts")?.file.map((item) => item.id)).toEqual(["stale"]);
  });

  it("finds discussions on files the diff does not touch", () => {
    const items = [
      finding("x", { file: "gone.ts", line: 1 }),
      finding("y", { file: "a.ts" }),
    ];
    expect(
      findingsOnUnchangedFiles(items, new Set(["a.ts"])).map((item) => item.id),
    ).toEqual(["x"]);
  });
});

describe("diffRows with pinned comments", () => {
  const patch = "@@ -10,5 +10,5 @@ ctx\n a\n b\n c\n-old\n+new";
  const kinds = (pinned: ReadonlySet<string>) =>
    diffRows(patch, { pinnedLines: pinned }).map((row) => row.type);

  it("collapses a context run nothing points at", () => {
    expect(kinds(new Set())).toEqual(["hunk", "run", "line", "line"]);
  });

  it("keeps the run open for a RIGHT-anchored pin", () => {
    expect(kinds(new Set(["RIGHT:11"]))).toEqual([
      "hunk",
      "line",
      "line",
      "line",
      "line",
      "line",
    ]);
  });

  it("keeps the run open for a LEFT-anchored pin on a context line", () => {
    expect(kinds(new Set(["LEFT:11"]))).toEqual([
      "hunk",
      "line",
      "line",
      "line",
      "line",
      "line",
    ]);
  });
});
