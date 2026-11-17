import { describe, expect, it, vi } from "vitest";
import { openIssueInPlace } from "./open-issue";

const click = (
  overrides: Partial<Parameters<typeof openIssueInPlace>[0]> = {},
) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  preventDefault: vi.fn(),
  ...overrides,
});

describe("openIssueInPlace", () => {
  it("opens a plain left click in place and stops the navigation", () => {
    const event = click();
    const open = vi.fn();
    expect(openIssueInPlace(event, open, "ACME-3")).toBe(true);
    expect(open).toHaveBeenCalledWith("ACME-3");
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("leaves modified, middle and handled clicks to the link", () => {
    for (const overrides of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
    ]) {
      const event = click(overrides);
      const open = vi.fn();
      expect(openIssueInPlace(event, open, "ACME-3")).toBe(false);
      expect(open).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });

  it("navigates normally without an in-place opener", () => {
    const event = click();
    expect(openIssueInPlace(event, undefined, "ACME-3")).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
