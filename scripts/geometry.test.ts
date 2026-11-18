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
