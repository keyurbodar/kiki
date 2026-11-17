import { describe, expect, it } from "vitest";
import type { TimelineRow } from "@/data/events";
import {
  displayPath,
  openMarks,
  threadSources,
  threadUploads,
} from "./thread-files";

const file = (fileId: string, name: string) => ({
  fileId,
  name,
  mediaType: "text/plain",
  sizeBytes: 1,
});

const rows = [
  {
    type: "user-message",
    createdAt: new Date(1000),
    files: [file("f1", "notes.md"), file("f2", "a/b.txt")],
  },
  {
    type: "agent-message",
    createdAt: new Date(2000),
    files: [
      { file: file("f1", "notes.md") },
      { file: file("f3", "notes.md"), title: "Second" },
    ],
    sources: [
      {
        ref: "r1",
        source: { kind: "machine", machineId: "m1", path: "/w/src/a.ts" },
      },
      {
        ref: "r2",
        source: { kind: "drive", location: "org-acme", path: "plan.md" },
      },
    ],
  },
  {
    type: "cluster",
    createdAt: new Date(3000),
    members: [
      {
        type: "update",
        kind: "task",
        childJamId: "jam_child",
        createdAt: new Date(3000),
        sources: [
          {
            ref: "r3",
            source: { kind: "machine", machineId: "m1", path: "/w/src/a.ts" },
          },
        ],
      },
    ],
  },
] as unknown as TimelineRow[];

describe("threadUploads", () => {
  it("dedupes by file id and disambiguates names", () => {
    const uploads = threadUploads(rows);
    expect(uploads.map((u) => u.path)).toEqual([
      "notes.md",
      "a_b.txt",
      "notes.md (2)",
    ]);
    expect(uploads[2]?.attachment.title).toBe("Second");
    expect(uploads[0]?.siblings).toHaveLength(2);
  });
});

describe("threadSources", () => {
  it("keeps the latest delivery of each source", () => {
    const sources = threadSources(rows, "jam_root");
    expect(sources.map((s) => [s.key, s.from])).toEqual([
      ["machine:m1:/w/src/a.ts", "jam_child"],
      ["drive:org-acme:plan.md", "jam_root"],
    ]);
  });
});

describe("displayPath", () => {
  it("strips the workspace root and leading slashes", () => {
    expect(displayPath("/w/src/a.ts", "/w/")).toBe("src/a.ts");
    expect(displayPath("/etc/hosts", "/w")).toBe("etc/hosts");
    expect(displayPath("/x/y")).toBe("x/y");
  });
});

describe("openMarks", () => {
  it("marks open, preview and current paths for one root", () => {
    const marks = openMarks(
      {
        files: [
          { root: "machine", path: "a.ts", id: "t1" },
          { root: "machine", path: "b.ts", id: "t2" },
          { root: "uploads", path: "c.ts", id: "t3" },
        ],
        previews: ["t2"],
        activeId: "t1",
      },
      "machine",
    );
    expect([...marks.openPaths]).toEqual(["a.ts", "b.ts"]);
    expect([...marks.previewPaths]).toEqual(["b.ts"]);
    expect(marks.currentPath).toBe("a.ts");
  });
});
