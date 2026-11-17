import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

const html = (text: string, gallery = false) =>
  render(<Markdown text={text} gallery={gallery} />).container;

const classes = (element: Element | null) => element?.className ?? "";

describe("markdown parts", () => {
  it("keeps the CSS-styled parts on their data slots", () => {
    const root = html("```ts\nconst a = 1;\n```");
    const header = root.querySelector('[data-slot="markdown-code-header"]');
    const language = root.querySelector('[data-slot="markdown-code-language"]');
    expect(header).not.toBeNull();
    expect(language?.textContent).toBe("ts");
    expect(classes(header)).toBe("");
    expect(classes(language)).toBe("");
  });

  it("wraps a table in a scroll frame", () => {
    const frame = html("| a | b |\n| - | - |\n| 1 | 2 |").querySelector(
      '[data-slot="markdown-table"]',
    );
    expect(frame?.querySelector("td")?.textContent).toBe("1");
    expect(classes(frame)).toBe("");
  });

  it("frames a single image as Capy's media card", () => {
    const frame = html("![capy](/icon.png)", true).querySelector(
      '[data-slot="markdown-gallery"]',
    );
    expect(frame?.tagName).toBe("SPAN");
    expect(classes(frame)).toContain("rounded-(--radius-card)");
    expect(classes(frame)).toContain("border-border-2");
    expect(classes(frame)).toContain("bg-secondary");
    expect(classes(frame)).toContain("max-w-(--media-box-w)");
    expect(classes(frame)).toContain("[&_img]:max-h-(--media-box-h)");
  });

  it("tiles a gallery of several images", () => {
    const frame = html("![a](/a.png)\n\n![b](/b.png)", true).querySelector(
      '[data-slot="markdown-gallery"]',
    );
    const tiles = [...(frame?.querySelectorAll("[data-gallery-index]") ?? [])];
    expect(tiles).toHaveLength(2);
    for (const tile of tiles) {
      expect(classes(tile)).toContain("rounded-(--radius-card)");
      expect(classes(tile)).toContain("bg-secondary");
    }
  });

  it("frames a video at the media column width", () => {
    const frame = html("![clip](https://example.com/clip.mp4)").querySelector(
      '[data-slot="markdown-video"]',
    );
    expect(frame?.tagName).toBe("SPAN");
    expect(frame?.getAttribute("data-video-src")).toBe(
      "https://example.com/clip.mp4",
    );
    expect(classes(frame)).toContain("block");
    expect(classes(frame)).toContain("w-full");
    expect(classes(frame)).toContain("max-w-(--media-box-w)");
  });
});
