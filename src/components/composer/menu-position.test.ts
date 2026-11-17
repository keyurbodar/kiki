import { describe, expect, it } from "vitest";
import {
  MENTION_MENU_MAX_HEIGHT,
  MENU_ANCHOR_GAP,
  MENU_MIN_HEIGHT,
  MENU_VIEWPORT_INSET,
  MENU_WIDTH,
  placeCaretMenu,
} from "./menu-position";

const viewport = { width: 1600, height: 1000 };
const size = { width: MENU_WIDTH, maxHeight: MENTION_MENU_MAX_HEIGHT };

describe("placeCaretMenu", () => {
  it("opens below the caret when there is room", () => {
    expect(
      placeCaretMenu(
        { left: 100, top: 100, bottom: 120 },
        viewport,
        undefined,
        size,
      ),
    ).toEqual({
      left: 100,
      top: 120 + MENU_ANCHOR_GAP,
      bottom: undefined,
      maxHeight: MENTION_MENU_MAX_HEIGHT,
    });
  });

  it("opens above when there is more room above", () => {
    const placement = placeCaretMenu(
      { left: 100, top: 900, bottom: 920 },
      viewport,
      undefined,
      size,
    );
    expect(placement.top).toBeUndefined();
    expect(placement.bottom).toBe(1000 - 900 + MENU_ANCHOR_GAP);
    expect(placement.maxHeight).toBe(MENTION_MENU_MAX_HEIGHT);
  });

  it("keeps the menu inside the viewport horizontally", () => {
    const right = placeCaretMenu(
      { left: 1500, top: 100, bottom: 120 },
      viewport,
      undefined,
      size,
    );
    expect(right.left).toBe(1600 - MENU_WIDTH - MENU_VIEWPORT_INSET);
    const left = placeCaretMenu(
      { left: 0, top: 100, bottom: 120 },
      viewport,
      undefined,
      size,
    );
    expect(left.left).toBe(MENU_VIEWPORT_INSET);
  });

  it("never shrinks below the minimum height", () => {
    const placement = placeCaretMenu(
      { left: 100, top: 300, bottom: 320 },
      { width: 1600, height: 600 },
      undefined,
      size,
    );
    expect(placement.maxHeight).toBeGreaterThanOrEqual(MENU_MIN_HEIGHT);
  });

  it("clamps to the bounding panel", () => {
    const placement = placeCaretMenu(
      { left: 100, top: 300, bottom: 320 },
      viewport,
      { top: 0, bottom: 500 },
      size,
    );
    expect(placement.top).toBeUndefined();
  });
});
