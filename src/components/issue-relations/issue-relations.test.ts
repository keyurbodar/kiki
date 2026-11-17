import type { MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { handleIssueLinkClick } from "./issue-relations";

const click = (keys: Partial<MouseEvent> = {}) => {
  const preventDefault = vi.fn();
  return {
    event: {
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault,
      ...keys,
    } as unknown as MouseEvent,
    preventDefault,
  };
};

describe("handleIssueLinkClick", () => {
  it("opens in place on a plain click", () => {
    const open = vi.fn();
    const { event, preventDefault } = click();
    handleIssueLinkClick(event, "pane", open);
    expect(preventDefault).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(false);
  });

  it("lets the link open a new tab from a collection", () => {
    const open = vi.fn();
    const { event, preventDefault } = click({ metaKey: true });
    handleIssueLinkClick(event, "collection", open);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("passes Cmd-click to the pane handler as a new tab", () => {
    const open = vi.fn();
    handleIssueLinkClick(click({ ctrlKey: true }).event, "pane", open);
    expect(open).toHaveBeenCalledWith(true);
  });

  it("leaves Shift clicks and unhandled links alone", () => {
    const open = vi.fn();
    handleIssueLinkClick(click({ shiftKey: true }).event, "pane", open);
    const { event, preventDefault } = click();
    handleIssueLinkClick(event, "pane", undefined);
    expect(open).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
