import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  groupHeads,
  layoutFlow,
  nodeCaption,
  ShowMeCard,
  type ShowMeLine,
  signCounts,
  splitField,
  treePrefix,
} from ".";

afterEach(cleanup);

const line = (
  text: string,
  depth: number,
  extra: Partial<ShowMeLine> = {},
): ShowMeLine => ({
  text,
  depth,
  sign: "same",
  note: null,
  path: null,
  line: null,
  ...extra,
});

describe("show-me model", () => {
  it("draws file tree connectors", () => {
    const lines = [
      line("src", 0),
      line("a.ts", 1),
      line("lib", 1),
      line("b.ts", 2),
    ];
    expect(lines.map((_, index) => treePrefix(lines, index))).toEqual([
      "",
      "├── ",
      "└── ",
      "    └── ",
    ]);
  });

  it("groups data shapes and splits fields", () => {
    expect(
      groupHeads([line("A", 0), line("x: string", 1), line("B", 0)]),
    ).toEqual([0, 2]);
    expect(splitField("retries: number")).toEqual({
      name: "retries",
      type: "number",
    });
    expect(splitField("plain")).toEqual({ name: "plain", type: null });
  });

  it("counts signs across views", () => {
    expect(
      signCounts([
        {
          shape: "pseudocode",
          title: "t",
          lines: [
            line("a", 0, { sign: "added" }),
            line("b", 0, { sign: "removed" }),
          ],
        },
        {
          shape: "flow",
          title: "f",
          nodes: [
            { id: "n", text: "x", sign: "added", path: null, line: null },
          ],
          edges: [],
        },
      ]),
    ).toEqual({ added: 2, removed: 1 });
  });

  it("captions flow nodes", () => {
    const base = { id: "n", text: "x", line: null };
    expect(nodeCaption({ ...base, sign: "added", path: "src/a.ts" })).toBe(
      "New · a.ts",
    );
    expect(nodeCaption({ ...base, sign: "removed", path: null })).toBe(
      "Removed",
    );
    expect(
      nodeCaption({ ...base, sign: "same", path: null, decision: true }),
    ).toBe("Decision");
  });

  it("lays flows out in columns by longest path", () => {
    const sizes = new Map([
      ["a", { w: 100, h: 20 }],
      ["b", { w: 50, h: 20 }],
      ["c", { w: 80, h: 30 }],
    ]);
    const layout = layoutFlow(
      {
        nodes: ["a", "b", "c"].map((id) => ({
          id,
          text: id,
          sign: "same" as const,
          path: null,
          line: null,
        })),
        edges: [
          { from: "a", to: "b", label: null },
          { from: "b", to: "c", label: "yes" },
          { from: "a", to: "c", label: null },
        ],
      },
      sizes,
    );
    expect(layout.boxes.get("b")).toEqual({ x: 148, y: 0, w: 50, h: 20 });
    expect(layout.boxes.get("c")?.x).toBe(246);
    expect(layout.width).toBe(326);
    expect(layout.height).toBe(30);
    expect(layout.edges[0]?.d).toBe("M100 10H124V10H148");
  });
});

describe("ShowMeCard", () => {
  it("opens files and lands on lines", () => {
    const onOpenFile = vi.fn();
    const onLand = vi.fn();
    render(
      <ShowMeCard
        views={[
          {
            shape: "call_tree",
            title: "checkout",
            lines: [
              line("submit()", 0, { path: "src/a.ts" }),
              line("retry()", 1, {
                path: "src/b.ts",
                line: 9,
                sign: "removed",
              }),
            ],
          },
        ]}
        chapterOf={(path) =>
          path === "src/b.ts" ? { id: "b", number: "02" } : undefined
        }
        onOpenFile={onOpenFile}
        onLand={onLand}
        onHint={vi.fn()}
      />,
    );
    expect(screen.getByText("Checkout")).toBeTruthy();
    expect(screen.getByText("−1")).toBeTruthy();
    fireEvent.click(screen.getByTitle("src/a.ts"));
    expect(onOpenFile).toHaveBeenCalledWith("src/a.ts");
    fireEvent.click(screen.getByTitle("src/b.ts:9 · chapter 02"));
    expect(onLand).toHaveBeenCalledWith("src/b.ts", 9, "deletions");
    fireEvent.click(screen.getByLabelText("Collapse before / after"));
    expect(screen.getByLabelText("Expand before / after")).toBeTruthy();
  });
});
