import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DotGridIcon, dotGridIconVariants } from "./dot-grid-icon";

const animate = vi.fn(
  () => ({ play() {}, pause() {}, cancel() {} }) as unknown as Animation,
);

beforeEach(() => {
  animate.mockClear();
  Element.prototype.animate = animate;
});
afterEach(cleanup);

describe("DotGridIcon", () => {
  it("renders Capy's 3x3 dot grid with the status role and label", () => {
    render(<DotGridIcon label="Cloning" />);
    const svg = screen.getByRole("status", { name: "Cloning" });
    expect(svg.dataset.slot).toBe("dot-grid-icon");
    expect(svg.dataset.state).toBe("working");
    expect(svg.querySelectorAll("[data-dot]")).toHaveLength(9);
    expect(svg.querySelectorAll("[data-ring]")).toHaveLength(8);
    expect(svg.querySelectorAll('[data-row="middle"]')).toHaveLength(3);
    expect(animate).toHaveBeenCalledTimes(8);
  });

  it("animates only the middle row while waiting", () => {
    render(<DotGridIcon state="waiting" />);
    expect(animate).toHaveBeenCalledTimes(3);
  });

  it("applies size variants", () => {
    expect(dotGridIconVariants()).toBe("dot-grid shrink-0 size-(--icon-base)");
    expect(dotGridIconVariants({ size: "xs" })).toContain("size-(--icon-xs)");
    expect(dotGridIconVariants({ size: "inherit" })).toBe("dot-grid shrink-0");
  });

  it("passes state, role and className through", () => {
    render(
      <DotGridIcon state="waiting" role="img" label="Waiting" className="x" />,
    );
    const svg = screen.getByRole("img", { name: "Waiting" });
    expect(svg.dataset.state).toBe("waiting");
    expect(svg.classList.contains("x")).toBe(true);
  });
});
