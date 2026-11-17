import { describe, expect, it } from "vitest";
import {
  classify,
  definedProperties,
  findPropertyUses,
  isRuntimeProperty,
} from "./custom-properties";

describe("findPropertyUses", () => {
  it("reads a literal var() with a fallback and without one", () => {
    const source = [
      "a { border: var(--border-width-hairline) solid var(--border-1); }",
      "b { color: var(--fg, black); }",
    ].join("\n");
    expect(findPropertyUses("a.css", source)).toEqual([
      { name: "--border-width-hairline", file: "a.css", line: 1 },
      { name: "--border-1", file: "a.css", line: 1 },
      { name: "--fg", file: "a.css", line: 2 },
    ]);
  });

  it("ignores a name composed at runtime", () => {
    expect(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the placeholder is the subject of the test
      findPropertyUses("a.tsx", "const c = `var(--chart-${index})`;"),
    ).toEqual([]);
    expect(findPropertyUses("a.tsx", "var(--spacing-)")).toEqual([]);
  });
});

describe("definedProperties", () => {
  it("reads a stylesheet declaration, a quoted key and a setter", () => {
    const defined = definedProperties([
      { path: "tokens.css", source: ":root { --fg: black; }" },
      { path: "a.tsx", source: 'style={{ "--diff-comment-index": 2 }}' },
      { path: "b.ts", source: 'node.style.setProperty("--cost-hue", "20");' },
    ]);
    expect([...defined.keys()]).toEqual([
      "--fg",
      "--diff-comment-index",
      "--cost-hue",
    ]);
  });
});

describe("classify", () => {
  const defined = new Map([["--known", "tokens.css:1"]]);

  it("reports a property nobody defines", () => {
    const verdict = classify(
      [{ name: "--missing", file: "a.css", line: 4 }],
      defined,
    );
    expect(verdict.unknown).toEqual([
      { name: "--missing", file: "a.css", line: 4 },
    ]);
    expect(verdict.stale).toEqual([]);
  });

  it("leaves a runtime property alone, and says so when it turns real", () => {
    expect(isRuntimeProperty("--available-height")).toBe(true);
    expect(isRuntimeProperty("--trees-icon-width")).toBe(true);
    expect(isRuntimeProperty("--missing")).toBe(false);

    expect(
      classify(
        [{ name: "--available-height", file: "a.css", line: 2 }],
        defined,
      ),
    ).toEqual({ unknown: [], stale: [] });

    const verdict = classify(
      [{ name: "--available-height", file: "a.css", line: 2 }],
      new Map([["--available-height", "a.css:9"]]),
    );
    expect(verdict.stale).toMatchObject([
      { name: "--available-height", definedIn: "a.css:9" },
    ]);
  });

  it("never calls a third-party prefix stale", () => {
    const verdict = classify(
      [{ name: "--trees-icon-width", file: "a.ts", line: 1 }],
      new Map([["--trees-icon-width", "a.ts:2"]]),
    );
    expect(verdict.stale).toEqual([]);
  });
});
