import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `recipes.css` is loaded by every route, so an unbalanced brace in it is not a
 * stylesheet bug — the parser gives up and every later rule is dropped, and the
 * failure surfaces as a lint error in whichever file the checker walked first.
 * A rebase left it one brace short once; this is the cheap guard against it
 * coming back unnoticed.
 */
const source = readFileSync("src/tokens/recipes.css", "utf8");

const count = (text: string, character: string) =>
  text.split(character).length - 1;

describe("recipes.css", () => {
  it("balances its braces", () => {
    expect(count(source, "{")).toBe(count(source, "}"));
  });

  it("opens one component layer and closes it", () => {
    expect(source.match(/@layer components \{/g)?.length).toBe(1);
    expect(source.trimEnd().endsWith("}")).toBe(true);
  });

  it("names every recipe class it declares", () => {
    const declared = source.match(/^\s*\.[a-z][\w-]*\s*\{/gm) ?? [];
    expect(declared.length).toBeGreaterThan(0);
    for (const selector of declared)
      expect(selector).toMatch(/^\s*\.kiki-[\w-]+\s*\{$/);
  });

  it("keeps to geometry, leaving paint and type to tsx", () => {
    const paint = source
      .split("\n")
      .filter((line) =>
        /^\s*(?:color|background|background-color|font-size|font-weight|font-family|line-height):/.test(
          line,
        ),
      );
    expect(paint).toEqual([]);
  });
});
