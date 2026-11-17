import { describe, expect, it } from "vitest";
import {
  classify,
  findClassCandidates,
  isAllowed,
  KNOWN_UNSTYLED,
  selectorOf,
} from "./utility-coverage";

const known = KNOWN_UNSTYLED[0] ?? { file: "", token: "", note: "" };

describe("findClassCandidates", () => {
  it("reads a quoted class list", () => {
    expect(findClassCandidates(`<div className="flex gap-2" />`)).toEqual([
      { token: "flex", line: 1 },
      { token: "gap-2", line: 1 },
    ]);
  });

  it("reads the literals inside a conditional list", () => {
    const source = `<div
  className={cx(
    "flex",
    open && "bg-card",
  )}
/>`;
    expect(findClassCandidates(source)).toEqual([
      { token: "flex", line: 3 },
      { token: "bg-card", line: 4 },
    ]);
  });

  it("skips interpolated classes and group markers", () => {
    const interpolated =
      "<a className={`w-" + "${" + "n} group/shell peer group`} />";
    expect(findClassCandidates(interpolated)).toEqual([]);
    expect(findClassCandidates('<a className="text-sm" />')).toEqual([
      { token: "text-sm", line: 1 },
    ]);
  });

  it("reports each class once per file", () => {
    expect(
      findClassCandidates('<i className="m-1 m-1" /><i className="m-1" />'),
    ).toEqual([{ token: "m-1", line: 1 }]);
  });
});

describe("selectorOf", () => {
  it("escapes variants and arbitrary values the way Tailwind does", () => {
    expect(selectorOf("md:pt-16")).toBe(".md\\:pt-16");
    expect(selectorOf("w-56!")).toBe(".w-56\\!");
    expect(selectorOf("[&>svg]:size-4")).toBe(".\\[\\&\\>svg\\]\\:size-4");
  });
});

describe("classify", () => {
  it("passes a known class that styles nothing", () => {
    expect(classify([{ ...known, line: 1, styled: false }])).toEqual({
      stale: [],
      unknown: [],
    });
  });

  it("flags a class nobody claimed", () => {
    expect(
      classify([
        { file: "src/a.tsx", token: "bg-nope", line: 7, styled: false },
      ]),
    ).toEqual({
      stale: [],
      unknown: [{ file: "src/a.tsx", token: "bg-nope", line: 7 }],
    });
  });

  it("flags a known class that now compiles", () => {
    expect(classify([{ ...known, line: 3, styled: true }])).toEqual({
      stale: [{ file: known.file, token: known.token, line: 3 }],
      unknown: [],
    });
  });
});

describe("isAllowed", () => {
  it("is scoped to the file the class was found in", () => {
    expect(isAllowed({ ...known, line: 1 })).toBe(true);
    expect(
      isAllowed({ file: "src/elsewhere.tsx", token: known.token, line: 1 }),
    ).toBe(false);
  });
});
