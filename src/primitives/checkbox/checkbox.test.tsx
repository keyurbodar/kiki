import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

afterEach(cleanup);

const indicator = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="checkbox-indicator"]');

describe("Checkbox", () => {
  it("draws Capy's box and mounts the indicator only once checked", () => {
    const { container } = render(<Checkbox aria-label="Pick" />);
    const box = screen.getByRole("checkbox", { name: "Pick" });
    expect(box.dataset.slot).toBe("checkbox");
    expect(box.getAttribute("aria-checked")).toBe("false");
    expect(box.className).toContain("size-4");
    expect(box.className).toContain("border-hairline");
    expect(box.className).toContain("focus-visible:outline-ring-inset");
    expect(indicator(container)).toBeNull();

    fireEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(box.hasAttribute("data-checked")).toBe(true);
    const shown = indicator(container);
    expect(shown?.className).toBe("flex items-center justify-center");
    expect(shown?.querySelector("svg")?.dataset.icon).toBe("checkmark-1");
  });

  it("reports the change to the caller", () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Pick" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("shows the minus glyph when indeterminate", () => {
    const { container } = render(<Checkbox aria-label="Some" indeterminate />);
    expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe(
      "mixed",
    );
    expect(indicator(container)?.querySelector("svg")?.dataset.icon).toBe(
      "minus-medium",
    );
  });

  it("does not toggle when disabled", () => {
    render(<Checkbox aria-label="Pick" disabled />);
    const box = screen.getByRole("checkbox");
    expect(box.hasAttribute("data-disabled")).toBe(true);
    fireEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("false");
  });

  it("merges a caller class, plain or derived from state", () => {
    render(<Checkbox aria-label="Pick" className="extra" />);
    const box = screen.getByRole("checkbox");
    expect(box.className).toContain("extra");
    expect(box.className).toContain("size-4");
    cleanup();
    render(
      <Checkbox
        aria-label="Pick"
        checked
        className={(state) => (state.checked ? "is-on" : "is-off")}
      />,
    );
    expect(screen.getByRole("checkbox").className).toContain("is-on");
  });
});
