import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScrollArea } from ".";

afterEach(cleanup);

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
});
