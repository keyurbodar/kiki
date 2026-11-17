import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { clampSplitSize, Split, TileDivider } from "./split";

afterEach(cleanup);

describe("Split", () => {
  it("clamps to min, max and 70% of the container", () => {
    expect(clampSplitSize(10, 100, 500, 0)).toBe(100);
    expect(clampSplitSize(900, 100, 500, 0)).toBe(500);
    expect(clampSplitSize(450, 100, 500, 600)).toBe(420);
  });

  it("sizes the start pane and steps with the keyboard", () => {
    const sizes: number[] = [];
    render(
      <Split
        defaultSize={300}
        minSize={200}
        maxSize={400}
        handleLabel="Resize list"
        onSizeChange={(size) => sizes.push(size)}
      >
        <div>start</div>
        <div>end</div>
      </Split>,
    );
    const start = screen.getByText("start").parentElement;
    expect(start?.style.width).toBe("300px");
    const handle = screen.getByRole("button", { name: "Resize list" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
    expect(sizes).toEqual([316, 364]);
    fireEvent.doubleClick(handle);
    expect(sizes.at(-1)).toBe(300);
  });

  it("sizes the end pane when edge is end", () => {
    render(
      <Split defaultSize={250} edge="end">
        <div>start</div>
        <div>end</div>
      </Split>,
    );
    expect(screen.getByText("end").parentElement?.style.width).toBe("250px");
    expect(screen.getByText("start").parentElement?.style.width).toBe("");
  });
});

describe("TileDivider", () => {
  it("labels and orients the handle", () => {
    const { rerender } = render(<TileDivider />);
    const divider = screen.getByRole("button");
    expect(divider.dataset.slot).toBe("tile-divider");
    expect(divider.getAttribute("aria-label")).toBe(
      "Resize panes side by side",
    );
    expect(divider.className).toContain("cursor-col-resize");
    rerender(<TileDivider sideBySide={false} dragging />);
    expect(divider.getAttribute("aria-label")).toBe("Resize stacked panes");
    expect(divider.className).toContain("cursor-row-resize");
    expect(divider.hasAttribute("data-dragging")).toBe(true);
  });
});
