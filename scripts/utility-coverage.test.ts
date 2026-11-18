import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  classify,
  findClassCandidates,
  isAllowed,
  KNOWN_UNSTYLED,
  selectorOf,
} from "./utility-coverage";
import { runUtilityCoverage } from "./utility-coverage-run";

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

describe("runUtilityCoverage against a real tree", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0))
      rmSync(root, { recursive: true, force: true });
  });

  /* Inside the repo so `@import 'tailwindcss'` resolves to the installed
     package, exactly as it does for src/styles.css. */
  const fixture = (files: Record<string, string>): string => {
    const root = mkdtempSync(join(process.cwd(), ".utility-coverage-"));
    roots.push(root);
    for (const [name, body] of Object.entries(files)) {
      const path = join(root, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
    return root;
  };

  it("fails on a class that styles nothing", async () => {
    const root = fixture({
      "styles.css": "@import 'tailwindcss';",
      "panel.tsx": `<div className="flex gap-2 bg-not-a-token" />`,
    });
    const result = await runUtilityCoverage({ root });
    expect(result.skipped).toBeUndefined();
    expect(result.unknown.map((entry) => entry.token)).toEqual([
      "bg-not-a-token",
    ]);
    expect(result.stale).toEqual([]);
  });

  it("passes a tree whose classes all compile", async () => {
    const root = fixture({
      "styles.css": "@import 'tailwindcss';",
      "panel.tsx": `<div className="flex gap-2" />`,
    });
    const result = await runUtilityCoverage({ root });
    expect(result.unknown).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.files.length).toBe(1);
  });

  it("reads a class a component stylesheet defines", async () => {
    const root = fixture({
      "styles.css": "@import 'tailwindcss';",
      "panel.css": ".panel-shell { display: flex; }",
      "panel.tsx": `<div className="panel-shell flex" />`,
    });
    const result = await runUtilityCoverage({ root });
    expect(result.unknown).toEqual([]);
  });
});
