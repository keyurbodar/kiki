import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

afterEach(cleanup);

describe("Switch", () => {
  it("draws Capy's track and thumb", () => {
    const { container } = render(<Switch aria-label="Notify" />);
    const control = screen.getByRole("switch", { name: "Notify" });
    expect(control.dataset.slot).toBe("switch");
    expect(control.className).toContain("h-4");
    expect(control.className).toContain("w-7");
    expect(control.className).toContain("p-switch-inset");
    expect(control.className).toContain("focus-visible:outline-ring-inset");
    expect(control.getAttribute("aria-checked")).toBe("false");

    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="switch-thumb"]',
    );
    expect(thumb).not.toBeNull();
    expect(thumb?.className).toContain("size-3");
    expect(thumb?.className).toContain("data-[checked]:translate-x-3");
  });

  it("toggles on click and reports the change", () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Notify" onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(control.hasAttribute("data-checked")).toBe(true);
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", () => {
    render(<Switch aria-label="Notify" disabled />);
    const control = screen.getByRole("switch");
    expect(control.hasAttribute("data-disabled")).toBe(true);
    fireEvent.click(control);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });

  it("merges a caller class, plain or derived from state", () => {
    render(<Switch aria-label="Notify" className="extra" />);
    expect(screen.getByRole("switch").className).toContain("extra");
    cleanup();
    render(
      <Switch
        aria-label="Notify"
        checked
        className={(state) => (state.checked ? "is-on" : "is-off")}
      />,
    );
    expect(screen.getByRole("switch").className).toContain("is-on");
  });
});
