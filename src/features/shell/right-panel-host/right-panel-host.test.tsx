import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clampRightPanelWidth,
  RIGHT_PANEL_WIDTH_KEY,
  RightPanelHost,
  RightPanelHostPanel,
  readStoredRightPanelWidth,
} from "./right-panel-host";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const group = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot=right-panel-group]");

describe("RightPanelHost", () => {
  it("clamps and reads the stored width", () => {
    expect(clampRightPanelWidth(100)).toBe(320);
    expect(readStoredRightPanelWidth(RIGHT_PANEL_WIDTH_KEY)).toBe(520);
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, "600");
    expect(readStoredRightPanelWidth(RIGHT_PANEL_WIDTH_KEY)).toBe(600);
  });

  it("sets --right-panel-width and grows with ArrowLeft", () => {
    const { container } = render(
      <RightPanelHost>
        <div>list</div>
        <RightPanelHostPanel>details</RightPanelHostPanel>
      </RightPanelHost>,
    );
    expect(
      group(container)?.style.getPropertyValue("--right-panel-width"),
    ).toBe("520px");
    const rail = container.querySelector<HTMLElement>(
      "[data-slot=right-panel-rail]",
    );
    if (!rail) throw new Error("missing rail");
    fireEvent.keyDown(rail, { key: "ArrowLeft" });
    expect(
      group(container)?.style.getPropertyValue("--right-panel-width"),
    ).toBe("528px");
    expect(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY)).toBe("528");
    fireEvent.keyDown(rail, { key: "ArrowRight", shiftKey: true });
    expect(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY)).toBe("496");
  });

  it("marks a closed panel inert with a closed state", () => {
    const { container } = render(
      <RightPanelHost storageKey={null}>
        <RightPanelHostPanel open={false}>details</RightPanelHostPanel>
      </RightPanelHost>,
    );
    const panel = container.querySelector("[data-slot=right-panel]");
    expect(panel?.getAttribute("data-state")).toBe("closed");
    expect(
      container
        .querySelector("[data-slot=right-panel-content]")
        ?.hasAttribute("inert"),
    ).toBe(true);
  });

  it("throws outside a group", () => {
    expect(() => render(<RightPanelHostPanel />)).toThrow(
      "RightPanel rendered outside a RightPanelGroup",
    );
  });
});
