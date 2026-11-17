import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollArea, ScrollAreaViewport } from ".";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const stubNarrow = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
    addEventListener() {},
    removeEventListener() {},
  } as unknown as MediaQueryList);

const measureViewport = (
  viewport: Element,
  {
    scrollHeight,
    clientHeight,
  }: { scrollHeight: number; clientHeight: number },
) => {
  Object.defineProperty(viewport, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(viewport, "clientHeight", {
    value: clientHeight,
    configurable: true,
  });
  viewport.dispatchEvent(new Event("scroll"));
};

describe("ScrollArea", () => {
  it("wraps children in Capy's viewport with fade caps", () => {
    const { container } = render(
      <ScrollArea fadeY retainScroll scrollRestorationId="list">
        <p>Row</p>
      </ScrollArea>,
    );
    const root = container.querySelector("[data-slot=scroll-area]");
    expect(root?.getAttribute("data-scroll-restoration-ignore")).toBe("");
    const viewport = screen
      .getByText("Row")
      .closest("[data-slot=scroll-area-viewport]");
    expect(viewport?.getAttribute("data-scroll-restoration-id")).toBe("list");
    expect(viewport?.className).toContain("[scrollbar-width:none]");
    expect(container.querySelector(".scroll-fade-cap-t")).not.toBeNull();
    expect(container.querySelector(".scroll-fade-cap-b")).not.toBeNull();
  });

  it("omits fade caps by default", () => {
    const { container } = render(<ScrollArea>content</ScrollArea>);
    expect(container.querySelector(".scroll-fade-cap-t")).toBeNull();
  });

  it("scrolls natively below the md breakpoint, without Base UI's scrollbar", () => {
    stubNarrow(true);
    const { container } = render(
      <ScrollArea fadeY retainScroll>
        <p>Row</p>
      </ScrollArea>,
    );
    expect(
      container.querySelector("[data-slot=scroll-area-scrollbar]"),
    ).toBeNull();
    const viewport = container.querySelector(
      "[data-slot=scroll-area-viewport]",
    );
    expect(viewport?.hasAttribute("data-id")).toBe(false);
    expect(viewport?.className).toContain("overflow-auto");
    expect(viewport?.className).toContain("[scrollbar-width:none]");
    expect(
      container
        .querySelector("[data-slot=scroll-area]")
        ?.getAttribute("data-scroll-restoration-ignore"),
    ).toBe("");
  });

  it("makes native viewports focusable and tracks both scroll edges", async () => {
    stubNarrow(true);
    const { container } = render(
      <ScrollArea fadeY>
        <p>Row</p>
      </ScrollArea>,
    );
    const root = container.querySelector("[data-slot=scroll-area]");
    const viewport = container.querySelector(
      "[data-slot=scroll-area-viewport]",
    );
    if (root === null || viewport === null) throw new Error("no scroll area");

    measureViewport(viewport, { scrollHeight: 400, clientHeight: 100 });
    await waitFor(() => {
      expect(viewport.getAttribute("tabindex")).toBe("0");
    });
    expect(root.hasAttribute("data-scroll-ready")).toBe(true);
    expect(root.hasAttribute("data-scroll-start")).toBe(true);
    expect(root.hasAttribute("data-scroll-end")).toBe(false);

    viewport.scrollTop = 300;
    viewport.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(root.hasAttribute("data-scroll-end")).toBe(true);
    });
    expect(root.hasAttribute("data-scroll-start")).toBe(false);
  });

  it("falls back to a plain nested viewport below md", () => {
    stubNarrow(true);
    const { container } = render(
      <ScrollArea>
        <ScrollAreaViewport className="size-full">
          <p>Row</p>
        </ScrollAreaViewport>
      </ScrollArea>,
    );
    const viewports = container.querySelectorAll(
      "[data-slot=scroll-area-viewport]",
    );
    expect(viewports).toHaveLength(2);
    for (const viewport of viewports)
      expect(viewport.hasAttribute("data-id")).toBe(false);
  });

  it("leaves the desktop viewport to Base UI", () => {
    const { container } = render(<ScrollArea>content</ScrollArea>);
    const viewport = container.querySelector(
      "[data-slot=scroll-area-viewport]",
    );
    expect(viewport?.hasAttribute("data-id")).toBe(true);
    expect(viewport?.className).not.toContain("overflow-auto");
  });
});
