import { describe, expect, it } from "vitest";
import { colorValueCss, literal, selfReferences, themeCss } from "./palette";

const base = {
  background: literal("#000000"),
  foreground: literal("#ffffff"),
  text: { kind: "reference", field: "foreground" },
  accent: literal("#ff0000"),
  accentText: literal("#ffffff"),
  shaderInk: { kind: "reference", field: "accent" },
} as const;

describe("palette", () => {
  it("renders literal, reference and mix values like Capy", () => {
    expect(colorValueCss(literal("#123456"))).toBe("#123456");
    expect(colorValueCss({ kind: "reference", field: "cardHover" })).toBe(
      "var(--card-hover)",
    );
    expect(
      colorValueCss({
        kind: "mix",
        first: literal("#ffffff"),
        second: { kind: "reference", field: "background" },
        firstWeight: 0.07,
      }),
    ).toBe("color-mix(in oklab, #ffffff 7%, var(--bg))");
  });

  it("writes light and dark blocks for a theme id", () => {
    const css = themeCss("custom", { light: base, dark: base });
    expect(css).toContain('[data-color-theme="custom"]:not(.dark) {');
    expect(css).toContain('.dark[data-color-theme="custom"] {');
    expect(css).toContain("  --text: var(--fg);");
  });

  it("finds keys that refer to themselves", () => {
    expect(selfReferences(base)).toEqual([]);
    expect(
      selfReferences({
        ...base,
        text: { kind: "reference", field: "card" },
        card: { kind: "reference", field: "text" },
      }),
    ).toEqual(["text", "card"]);
  });
});
