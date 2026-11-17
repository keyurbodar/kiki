import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("toggles and shows the check indicator", () => {
    const { container } = render(<Checkbox aria-label="Pick" />);
    const box = screen.getByRole("checkbox", { name: "Pick" });
    expect(box.dataset.slot).toBe("checkbox");
    expect(box.getAttribute("aria-checked")).toBe("false");
    expect(
      container.querySelector('[data-slot="checkbox-indicator"]'),
    ).toBeNull();
    fireEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(box.hasAttribute("data-checked")).toBe(true);
    const indicator = container.querySelector(
      '[data-slot="checkbox-indicator"]',
    );
    expect(
      indicator?.querySelector('[data-icon="checkmark-1"]'),
    ).not.toBeNull();
  });

  it("shows the minus glyph when indeterminate", () => {
    const { container } = render(<Checkbox aria-label="Some" indeterminate />);
    expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe(
      "mixed",
    );
    expect(
      container.querySelector('[data-icon="minus-medium"]'),
    ).not.toBeNull();
  });

  it("merges a caller class", () => {
    render(<Checkbox aria-label="Pick" className="extra" />);
    const box = screen.getByRole("checkbox");
    expect(box.className).toContain("extra");
    expect(box.className).toContain("size-4");
  });
});
