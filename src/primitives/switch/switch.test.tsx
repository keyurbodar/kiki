import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

afterEach(cleanup);

describe("Switch", () => {
  it("toggles on click and reports the change", () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Switch aria-label="Notify" onCheckedChange={onCheckedChange} />,
    );
    const control = screen.getByRole("switch", { name: "Notify" });
    expect(control.dataset.slot).toBe("switch");
    expect(
      container.querySelector('[data-slot="switch-thumb"]'),
    ).not.toBeNull();
    fireEvent.click(control);
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", () => {
    render(<Switch aria-label="Notify" disabled />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });
});
