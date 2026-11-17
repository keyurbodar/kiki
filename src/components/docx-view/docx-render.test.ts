import { describe, expect, it } from "vitest";
import {
  isSafeAttribute,
  pageWidth,
  sanitizeNode,
  withFallbackFamily,
} from "./docx-render";
import { fitZoom } from "./docx-view";

describe("docx sanitizing", () => {
  const anchor = document.createElement("a");
  const image = document.createElement("img");

  it("allows only safe link and image targets", () => {
    expect(isSafeAttribute(anchor, "href", "https://example.com")).toBe(true);
    expect(isSafeAttribute(anchor, "href", "#section")).toBe(true);
    expect(isSafeAttribute(anchor, "href", "javascript:alert(1)")).toBe(false);
    expect(isSafeAttribute(image, "src", "data:image/png;base64,AAAA")).toBe(
      true,
    );
    expect(isSafeAttribute(image, "src", "https://example.com/a.png")).toBe(
      false,
    );
    expect(isSafeAttribute(image, "onerror", "x")).toBe(false);
    expect(isSafeAttribute(image, "data-x", "url(https://example.com)")).toBe(
      false,
    );
  });

  it("strips blocked elements and handlers and opens external links in a new tab", () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<p onclick="x()">Hi <a href="https://example.com">out</a><a href="#in">in</a></p><script>x()</script>';
    const clean = sanitizeNode(root) as HTMLElement;
    expect(clean.querySelector("script")).toBeNull();
    expect(clean.querySelector("p")?.hasAttribute("onclick")).toBe(false);
    const [external, internal] = clean.querySelectorAll("a");
    expect(external?.getAttribute("target")).toBe("_blank");
    expect(external?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(internal?.hasAttribute("target")).toBe(false);
    expect(sanitizeNode(document.createElement("iframe"))).toBeUndefined();
    expect(sanitizeNode(document.createComment("x"))).toBeUndefined();
  });

  it("adds a generic fallback font family", () => {
    expect(withFallbackFamily("Consolas")).toBe("Consolas, monospace");
    expect(withFallbackFamily("Georgia")).toBe("Georgia, serif");
    expect(withFallbackFamily("Calibri")).toBe("Calibri, var(--font-sans)");
    expect(withFallbackFamily("Arial, sans-serif")).toBe("Arial, sans-serif");
  });
});

describe("docx layout", () => {
  it("measures the widest page in css pixels", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<section class="docx" style="width: 612pt"></section><section class="docx" style="width: 792pt"></section>';
    expect(pageWidth([wrapper])).toBe(1056);
    expect(pageWidth([])).toBe(816);
  });

  it("fits the page to the viewport without enlarging it", () => {
    expect(fitZoom(2000, 816)).toBe(1);
    expect(fitZoom(432, 816)).toBe(0.5);
    expect(fitZoom(10, 816)).toBe(0.25);
  });
});
