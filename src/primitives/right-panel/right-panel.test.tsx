import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampRightPanelWidth,
  RIGHT_PANEL_WIDTH_KEY,
  RightPanel,
  RightPanelGroup,
  readStoredRightPanelWidth,
} from "./right-panel";

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot=${name}]`);

const groupWidth = () =>
  slot("right-panel-group")?.style.getPropertyValue("--right-panel-width");

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("right panel width", () => {
  it("never goes below 320", () => {
    expect(clampRightPanelWidth(100)).toBe(320);
    expect(clampRightPanelWidth(600)).toBe(600);
  });

  it("falls back to 520 for missing or invalid stored values", () => {
    expect(readStoredRightPanelWidth(RIGHT_PANEL_WIDTH_KEY)).toBe(520);
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, "wide");
    expect(readStoredRightPanelWidth(RIGHT_PANEL_WIDTH_KEY)).toBe(520);
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, "400");
    expect(readStoredRightPanelWidth(RIGHT_PANEL_WIDTH_KEY)).toBe(400);
  });
});

describe("RightPanel", () => {
  it("throws outside a RightPanelGroup", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RightPanel>pane</RightPanel>)).toThrow(
      "RightPanel rendered outside a RightPanelGroup",
    );
    vi.restoreAllMocks();
  });

  it("renders the group, panel, content and rail slots", () => {
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, "100");
    render(
      <RightPanelGroup>
        <RightPanel>pane</RightPanel>
      </RightPanelGroup>,
    );
    expect(groupWidth()).toBe("320px");
    expect(slot("right-panel")?.tagName).toBe("ASIDE");
    expect(slot("right-panel")?.dataset.state).toBe("open");
    expect(slot("right-panel")?.className).toContain("border-l-hairline");
    expect(slot("right-panel-content")?.textContent).toBe("pane");
    expect(slot("right-panel-rail")?.tabIndex).toBe(0);
  });

  it("caps the panel at 38% of the work area, as Capy's dock is capped", () => {
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, "520");
    render(
      <RightPanelGroup>
        <RightPanel>pane</RightPanel>
      </RightPanelGroup>,
    );
    const className = slot("right-panel")?.className ?? "";
    expect(className).toContain("w-[min(var(--right-panel-width),38cqw)]");
    expect(className).not.toContain("clamp(");
  });

  it("closes to zero width with inert content and an inactive rail", () => {
    render(
      <RightPanelGroup>
        <RightPanel open={false}>pane</RightPanel>
      </RightPanelGroup>,
    );
    expect(slot("right-panel")?.dataset.state).toBe("closed");
    expect(slot("right-panel")?.className).toContain("w-0");
    expect(slot("right-panel-content")?.hasAttribute("inert")).toBe(true);
    expect(slot("right-panel-rail")?.tabIndex).toBe(-1);
  });

  it("goes full width without a border or rail in fullscreen", () => {
    render(
      <RightPanelGroup>
        <RightPanel fullscreen>pane</RightPanel>
      </RightPanelGroup>,
    );
    expect(slot("right-panel")?.className).toContain("w-[100cqw] border-l-0");
    expect(slot("right-panel-content")?.className).toContain("w-[100cqw]");
    expect(slot("right-panel-rail")?.tabIndex).toBe(-1);
  });

  it("resizes from the rail with the arrow keys, persisted per key", () => {
    render(
      <RightPanelGroup>
        <RightPanel>pane</RightPanel>
      </RightPanelGroup>,
    );
    const rail = screen.getByRole("button", { name: "Resize panel" });
    fireEvent.keyDown(rail, { key: "ArrowLeft" });
    expect(groupWidth()).toBe("528px");
    fireEvent.keyDown(rail, { key: "ArrowRight", shiftKey: true });
    expect(groupWidth()).toBe("496px");
    expect(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY)).toBe("496");
    fireEvent.doubleClick(rail);
    expect(groupWidth()).toBe("520px");
  });

  it("keeps width in memory when storageKey is null", () => {
    render(
      <RightPanelGroup storageKey={null}>
        <RightPanel>pane</RightPanel>
      </RightPanelGroup>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Resize panel" }), {
      key: "ArrowLeft",
    });
    expect(groupWidth()).toBe("528px");
    expect(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY)).toBeNull();
  });

  it("closes when dragged below half the minimum width", () => {
    const onClose = vi.fn();
    render(
      <RightPanelGroup>
        <RightPanel onClose={onClose}>pane</RightPanel>
      </RightPanelGroup>,
    );
    const rail = screen.getByRole("button", { name: "Resize panel" });
    const panel = slot("right-panel") as HTMLElement;
    panel.getBoundingClientRect = () => ({ width: 400 }) as DOMRect;
    rail.setPointerCapture = () => {};
    rail.hasPointerCapture = () => false;
    fireEvent.pointerDown(rail, { button: 0, pointerId: 1, clientX: 500 });
    expect(document.body.style.cursor).toBe("col-resize");
    fireEvent.pointerMove(rail, { pointerId: 1, clientX: 800 });
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.body.style.cursor).toBe("");
    expect(groupWidth()).toBe("520px");
  });
});
