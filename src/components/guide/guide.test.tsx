import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chapterNumbering, GuideBody, type GuideChapter, splitPath } from ".";

afterEach(cleanup);

const chapter = (id: string, paths: string[]): GuideChapter => ({
  id,
  title: `Chapter ${id}`,
  explanation: id === "overview" ? "" : "Why this changed",
  files: paths.map((path) => ({ path, additions: 2, deletions: 1 })),
  related: [],
});

const chapters = [
  chapter("overview", []),
  chapter("a", ["src/a.ts"]),
  chapter("b", ["src/b.ts", "src/c.ts"]),
  chapter("hidden-files", ["bun.lock"]),
];

describe("chapterNumbering", () => {
  it("numbers chapters past overview and hidden files", () => {
    const numbering = chapterNumbering(chapters);
    expect(numbering.position(1)).toBe("01 / 02");
    expect(numbering.position(2)).toBe("02 / 02");
    expect(numbering.position(3)).toBe("Hidden");
    expect(numbering.chapterOf.get("src/c.ts")).toEqual({
      id: "b",
      number: "02",
    });
    expect(numbering.chapterOf.has("bun.lock")).toBe(false);
  });

  it("splits paths", () => {
    expect(splitPath("src/a/b.ts")).toEqual({ name: "b.ts", dir: "src/a/" });
    expect(splitPath("b.ts")).toEqual({ name: "b.ts", dir: "" });
  });
});

describe("GuideBody", () => {
  it("collapses a chapter's files when it is marked reviewed", () => {
    const onCollapseFiles = vi.fn();
    const onChapterReviewed = vi.fn();
    render(
      <GuideBody
        chapters={chapters}
        collapsed={new Set()}
        onCollapseFiles={onCollapseFiles}
        onOpenFile={vi.fn()}
        onChapterReviewed={onChapterReviewed}
        renderFile={(file) => <div>diff {file.path}</div>}
      />,
    );
    expect(screen.getByText("01 / 02")).toBeTruthy();
    expect(screen.getByText("Hidden · 1 file")).toBeTruthy();
    const second = screen.getAllByRole("checkbox")[1];
    if (second === undefined) throw new Error("missing checkbox");
    fireEvent.click(second);
    expect(onCollapseFiles).toHaveBeenCalledWith(
      ["src/b.ts", "src/c.ts"],
      true,
    );
    expect(onChapterReviewed).toHaveBeenCalledWith(3, true);
  });
});
