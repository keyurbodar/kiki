import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICON_IDS, ICON_KEYWORDS, Icon, isIconId } from ".";
import sprite from "./sprite.svg?raw";

const symbolIds = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(
  (m) => m[1],
);

describe("Icon", () => {
  it("renders a decorative 24-unit glyph from the sprite by default", () => {
    const { container } = render(<Icon name="magnifying-glass" />);
    const svg = container.querySelector("svg");
    expect(svg?.dataset.icon).toBe("magnifying-glass");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
    expect(svg?.querySelector("title")).toBeNull();
    expect(svg?.querySelector("use")?.getAttribute("href")).toMatch(
      /#magnifying-glass$/,
    );
  });

  it("leaves sizing to the parent when no size is given", () => {
    const { container } = render(<Icon name="plus-medium" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe(
      "shrink-0",
    );
  });

  it.each([
    ["xs", "size-(--icon-xs)"],
    ["sm", "size-(--icon-sm)"],
    ["base", "size-(--icon-base)"],
    ["lg", "size-(--icon-lg)"],
  ] as const)("sizes %s with the %s token", (size, cls) => {
    const { container } = render(<Icon name="archive" size={size} />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe(
      `shrink-0 ${cls}`,
    );
  });

  it("keeps caller classes for colour and inline placement", () => {
    const { container } = render(
      <Icon name="clock" className="text-icon-muted" />,
    );
    expect(container.querySelector("svg")?.getAttribute("class")).toBe(
      "shrink-0 text-icon-muted",
    );
  });

  it("exposes a labelled icon as an image with a title", () => {
    const { getByRole } = render(<Icon name="trash-can" label="Delete" />);
    const svg = getByRole("img", { name: "Delete" });
    expect(svg.getAttribute("aria-hidden")).toBe("false");
    expect(svg.querySelector("title")?.textContent).toBe("Delete");
  });
});

describe("sprite", () => {
  it("has exactly one symbol per icon id", () => {
    expect(symbolIds).toEqual([...ICON_IDS]);
    expect(new Set(symbolIds).size).toBe(symbolIds.length);
  });

  it("draws every symbol on Capy's 24 grid in currentColor", () => {
    for (const m of sprite.matchAll(/<symbol [^>]*>/g)) {
      expect(m[0]).toContain('viewBox="0 0 24 24"');
      expect(m[0]).toContain('fill="none"');
    }
  });

  it("keeps Capy's keywords for every id", () => {
    for (const id of ICON_IDS)
      expect(ICON_KEYWORDS[id].split(",")[0]).toBe(
        id.replace(/-(outline|filled|alt)$/, ""),
      );
  });
});

describe("isIconId", () => {
  it("narrows known ids only", () => {
    expect(isIconId("list-bullets")).toBe(true);
    expect(isIconId("check-circle-2-outline")).toBe(true);
    expect(isIconId("not-an-icon")).toBe(false);
  });
});
