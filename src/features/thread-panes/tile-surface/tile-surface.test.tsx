import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultTiles,
  TileGroup,
  TileLeaf,
  type TileRect,
  TileSurface,
} from "./index";

afterEach(cleanup);

const rect: TileRect = {
  left: "0%",
  top: "0%",
  width: "100%",
  height: "100%",
};
const renderGroup = (id: string) => (
  <TileGroup id={id} strip={<span>{id}</span>}>
    body
  </TileGroup>
);
const surface = (
  props: Partial<React.ComponentProps<typeof TileSurface>> = {},
) =>
  render(
    <TileSurface
      node={defaultTiles}
      home="main"
      renderGroup={renderGroup}
      {...props}
    />,
  ).container;

describe("TileSurface", () => {
  it("lays out both default tiles with a divider", () => {
    const root = surface();
    expect(root.firstElementChild?.getAttribute("data-tile-surface")).toBe(
      "true",
    );
    expect(
      (root.firstElementChild as HTMLElement).style.getPropertyValue(
        "--tile-r",
      ),
    ).toBe("0.62");
    const leaves = root.querySelectorAll("[data-tile-leaf]");
    expect([...leaves].map((el) => el.getAttribute("data-tile-leaf"))).toEqual([
      "main",
      "side",
    ]);
    const button = root.querySelector('button[data-slot="tile-divider"]');
    expect(button?.getAttribute("aria-label")).toBe(
      "Resize panes side by side",
    );
  });

  it("keeps a hidden tile mounted without a divider", () => {
    const root = surface({ shown: (id) => id !== "side" });
    const side = root.querySelector('[data-tile-leaf="side"]');
    expect(side?.hasAttribute("hidden")).toBe(true);
    expect(root.querySelector('[data-slot="tile-divider"]')).toBeNull();
  });

  it("covers the other tile when one is expanded", () => {
    const root = surface({ expanded: "side" });
    const side = root.querySelector('[data-tile-leaf="side"]');
    const main = root.querySelector('[data-tile-leaf="main"]');
    expect(side?.hasAttribute("data-expanded")).toBe(true);
    expect((main as HTMLElement)?.inert).toBe(true);
    expect(main?.className).toContain("invisible");
    expect(root.querySelector('[data-slot="tile-divider"]')).toBeNull();
  });

  it("expands a tile by double-clicking its header strip", () => {
    const onExpand = vi.fn();
    const root = surface({ onExpand });
    const strip = root.querySelector(
      '[data-tile-group="side"]',
    )?.firstElementChild;
    fireEvent.doubleClick(strip as Element);
    expect(onExpand).toHaveBeenCalledWith("side");

    const button = document.createElement("button");
    strip?.appendChild(button);
    onExpand.mockClear();
    fireEvent.doubleClick(button);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("animates a tile after it opens but not one always shown", () => {
    const { container, rerender } = render(
      <TileLeaf id="main" rect={rect} hidden>
        body
      </TileLeaf>,
    );
    const leaf = container.querySelector(
      '[data-tile-leaf="main"]',
    ) as HTMLElement;
    expect(leaf.className).not.toContain("starting:opacity-0");
    rerender(
      <TileLeaf id="main" rect={rect}>
        body
      </TileLeaf>,
    );
    expect(leaf.className).toContain("starting:opacity-0");
    cleanup();

    const plain = render(
      <TileLeaf id="main" rect={rect}>
        body
      </TileLeaf>,
    ).container.querySelector('[data-tile-leaf="main"]');
    expect(plain?.className).not.toContain("starting:opacity-0");
  });

  it("handles divider keyboard nudges and double-click resets", () => {
    const onRatio = vi.fn();
    const root = surface({ onRatio });
    const divider = root.querySelector(
      'button[data-slot="tile-divider"]',
    ) as HTMLElement;
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(onRatio).toHaveBeenCalledWith("", expect.any(Number));
    expect(onRatio.mock.calls[0]?.[1]).toBeGreaterThan(0.62);
    fireEvent.doubleClick(divider);
    expect(onRatio).toHaveBeenLastCalledWith("", 0.5);
  });

  it("renders children when no tile tree is given", () => {
    const root = render(
      <TileSurface>
        <span>child</span>
      </TileSurface>,
    ).container;
    expect(root.firstElementChild?.getAttribute("data-tile-surface")).toBe(
      "true",
    );
    expect(root.textContent).toBe("child");
  });
});
