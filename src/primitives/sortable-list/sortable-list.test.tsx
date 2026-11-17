import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDuration } from "./motion";
import { reorderIds, restrictToVerticalContainer } from "./reorder";
import {
  SortableHandle,
  SortableList,
  SortableRowProvider,
  useSortableRow,
} from "./sortable-list";

afterEach(cleanup);

const rect = (top: number, bottom: number) => ({
  top,
  bottom,
  left: 0,
  right: 100,
  width: 100,
  height: bottom - top,
});

describe("reorderIds", () => {
  const ids = ["alpha", "beta", "gamma"];

  it("moves the active id to the slot it was dropped on", () => {
    expect(reorderIds(ids, "alpha", "gamma")).toEqual([
      "beta",
      "gamma",
      "alpha",
    ]);
    expect(reorderIds(ids, "gamma", "alpha")).toEqual([
      "gamma",
      "alpha",
      "beta",
    ]);
  });

  it("ignores drops outside the list, onto itself or onto unknown ids", () => {
    expect(reorderIds(ids, "alpha", null)).toBeNull();
    expect(reorderIds(ids, "beta", "beta")).toBeNull();
    expect(reorderIds(ids, "alpha", "delta")).toBeNull();
  });

  it("never mutates the ids it was given", () => {
    const frozen = Object.freeze([...ids]);
    reorderIds(frozen, "alpha", "beta");
    expect(frozen).toEqual(ids);
  });
});

describe("restrictToVerticalContainer", () => {
  const transform = { x: 40, y: 0, scaleX: 1, scaleY: 1 };
  const apply = (y: number, withRects = true) =>
    restrictToVerticalContainer({
      transform: { ...transform, y },
      draggingNodeRect: withRects ? rect(100, 130) : null,
      containerNodeRect: withRects ? rect(50, 200) : null,
    } as Parameters<typeof restrictToVerticalContainer>[0]);

  it("locks the x axis", () => {
    expect(apply(10).x).toBe(0);
    expect(apply(10, false)).toEqual({ ...transform, x: 0, y: 10 });
  });

  it("keeps the row inside the container", () => {
    expect(apply(10).y).toBe(10);
    expect(apply(-500).y).toBe(-50);
    expect(apply(500).y).toBe(70);
  });
});

describe("parseDuration", () => {
  it("reads token durations in seconds or milliseconds", () => {
    expect(parseDuration("0.15s")).toBe(150);
    expect(parseDuration(" 120ms ")).toBe(120);
    expect(parseDuration("")).toBe(0);
  });
});

function Row({ id, disabled }: { id: string; disabled?: boolean }) {
  const { row, nodeProps } = useSortableRow(id, disabled);
  return (
    <div {...nodeProps} className="group/row">
      <SortableRowProvider row={row}>
        <SortableHandle label={id} disabled={disabled} />
        <span>{id}</span>
      </SortableRowProvider>
    </div>
  );
}

describe("SortableList", () => {
  it("renders rows with Reorder handles inside the sortable-list slot", () => {
    const onReorder = vi.fn();
    render(
      <SortableList ids={["alpha", "beta"]} onReorder={onReorder}>
        <Row id="alpha" />
        <Row id="beta" disabled />
      </SortableList>,
    );
    const handle = screen.getByRole("button", { name: "Reorder alpha" });
    expect(handle.dataset.slot).toBe("sortable-handle");
    expect(handle.className).toContain("cursor-grab");
    const list = handle.closest("[data-slot=sortable-list]");
    expect(list?.className).toContain("flex flex-col");
    expect(list?.querySelectorAll("[data-drop-settle]")).toHaveLength(2);
    const disabled = screen.getByRole("button", { name: "Reorder beta" });
    expect(disabled.className).toContain("cursor-default");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("requires a SortableRowProvider around SortableHandle", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SortableHandle label="alpha" />)).toThrow(
      "SortableHandle renders inside SortableRowProvider",
    );
    vi.restoreAllMocks();
  });
});
