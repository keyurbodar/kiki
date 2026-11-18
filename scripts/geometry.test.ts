import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { escapes, findGeometry } from "./geometry";

const matches = (source: string) =>
  findGeometry(source).map((hit) => hit.match);

describe("findGeometry", () => {
  it("flags spacing, sizing, alignment, inset and column utilities", () => {
    expect(
      matches(
        '<div className="h-11 px-2 gap-2 items-center justify-end w-24 top-0 grid-cols-3 text-center" />',
      ),
    ).toEqual([
      "px-2",
      "gap-2",
      "h-11",
      "w-24",
      "items-center",
      "justify-end",
      "text-center",
      "top-0",
      "grid-cols-3",
    ]);
  });

  it("leaves colour, typography, radius and state utilities alone", () => {
    expect(
      matches(
        '<div className="bg-section text-sm text-muted-foreground-2 rounded hover:bg-secondary border-hairline" />',
      ),
    ).toEqual([]);
  });

  it("does not read a size out of a longer class name", () => {
    expect(matches('<div className="h-full w-fit" />')).toEqual([]);
  });

  it("ignores a line that carries the escape attribute", () => {
    expect(
      matches('<div data-geometry="free" className="w-[37px] h-[12px]" />'),
    ).toEqual([]);
  });

  it("reports the line and column of each hit", () => {
    const hits = findGeometry('<div\n  className="p-2"\n/>');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ line: 2, match: "p-2", kind: "spacing" });
  });
});

describe("escapes", () => {
  it("counts an escape that says why", () => {
    const source = [
      '<div data-geometry="free" className="w-[37px]" /> // measured from Capy',
      '<div data-geometry="free" className="h-[12px]" /> // chart height',
    ].join("\n");
    expect(escapes(source)).toEqual({ explained: 2, unexplained: [] });
  });

  it("fails an escape with no reason", () => {
    expect(
      escapes('<div data-geometry="free" className="w-[37px]" />'),
    ).toEqual({ explained: 0, unexplained: [1] });
  });
});

/**
 * A guard a merge can silently delete is not a guard: #500 removed
 * `check-geometry.ts` and its baseline from main and every lane kept reading a
 * count that no longer meant anything. This asserts the guard is wired in.
 */
describe("the geometry guard is installed", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts?: Record<string, string>;
  };

  it("runs from the lint script", () => {
    expect(pkg.scripts?.lint).toContain("bun scripts/check-geometry.ts");
  });

  it("keeps its script, its logic and its baseline in the tree", () => {
    for (const file of [
      "scripts/check-geometry.ts",
      "scripts/geometry.ts",
      "scripts/geometry-baseline.ts",
      "scripts/geometry-baseline.json",
    ])
      expect(existsSync(file), file).toBe(true);
  });

  it("still finds geometry in a file that carries it", () => {
    expect(findGeometry('<div className="h-11 px-2" />')).toHaveLength(2);
  });
});
