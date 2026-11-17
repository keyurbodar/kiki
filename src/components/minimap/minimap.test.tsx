import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Minimap,
  railHeight,
  railWidth,
  tickAtPointer,
  tickPercent,
  tickScale,
} from "./minimap";

afterEach(cleanup);

type Item = { id: string };
const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("minimap geometry", () => {
  it("places ticks evenly and handles empty rails", () => {
    expect(tickPercent(0, 1)).toBe(50);
    expect(tickPercent(0, 3)).toBe(0);
    expect(tickPercent(2, 3)).toBe(100);
    expect(tickPercent(1, 3)).toBe(50);
    expect(tickPercent(9, 3)).toBe(100);
    expect(tickPercent(-1, 3)).toBe(0);
  });

  it("rounds the tick under the pointer and clamps it", () => {
    const rail = { itemCount: 3, railStart: 100, railSize: 100 };
    expect(tickAtPointer({ ...rail, itemCount: 0, pointer: 150 })).toBeNull();
    expect(tickAtPointer({ ...rail, railSize: 0, pointer: 150 })).toBeNull();
    expect(tickAtPointer({ ...rail, itemCount: 1, pointer: 150 })).toBe(0);
    expect(tickAtPointer({ ...rail, pointer: 125 })).toBe(1);
    expect(tickAtPointer({ ...rail, pointer: 10 })).toBe(0);
    expect(tickAtPointer({ ...rail, pointer: 1000 })).toBe(2);
  });

  it("sizes rails with spacing units", () => {
    expect(railHeight(3)).toContain("var(--spacing) * 4");
    expect(railWidth(3)).toContain("var(--spacing) * 6");
    expect(railHeight(1)).toContain("var(--spacing) * 2");
  });

  it("scales ticks by their distance from the hovered one", () => {
    expect(tickScale(0, false)).toContain("scale-x-100");
    expect(tickScale(1, false)).toContain("scale-x-[0.667]");
    expect(tickScale(3, false)).toContain("scale-x-[0.333]");
    expect(tickScale(0, true)).toContain("scale-y-100");
    expect(tickScale(1, true)).toContain("scale-y-[0.75]");
    expect(tickScale(3, true)).toContain("scale-y-[0.625]");
  });
});

describe("Minimap", () => {
  const renderMinimap = (onSelect = vi.fn()) => {
    const tickMap = new Map<string, HTMLElement>();
    const root = render(
      <Minimap
        items={items}
        tickMap={tickMap}
        hitStripWidth={40}
        label={(item) => (item ? `Jump to ${item.id}` : "Jump")}
        renderPreview={(item) => <span>{`preview ${item.id}`}</span>}
        onSelect={onSelect}
      />,
    ).container;
    return { root, tickMap, onSelect };
  };

  it("registers a tick per item and labels the rail", () => {
    const { root, tickMap } = renderMinimap();
    expect([...tickMap.keys()]).toEqual(["a", "b", "c"]);
    expect(
      root
        .querySelector("button[data-minimap-rail]")
        ?.getAttribute("aria-label"),
    ).toBe("Jump");
  });

  it("selects with arrow keys, Enter and End", () => {
    const { root, onSelect } = renderMinimap();
    const rail = root.querySelector("button[data-minimap-rail]") as HTMLElement;
    fireEvent.focus(rail);
    fireEvent.keyDown(rail, { key: "ArrowDown" });
    fireEvent.keyDown(rail, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[1]);

    onSelect.mockClear();
    fireEvent.keyDown(rail, { key: "End" });
    fireEvent.keyDown(rail, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[2]);
  });

  it("renders nothing below minItems", () => {
    const { container } = render(
      <Minimap
        items={[items[0] as Item]}
        tickMap={new Map()}
        hitStripWidth={40}
        label={() => "Jump"}
        renderPreview={(item) => <span>{item.id}</span>}
        onSelect={() => {}}
      />,
    );
    expect(container.querySelector("[data-minimap-rail]")).toBeNull();
  });
});
