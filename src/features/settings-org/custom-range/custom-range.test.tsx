import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomRange } from "./custom-range";

describe("CustomRange", () => {
  it("shows the selected dates and applies a valid range", () => {
    const onApply = vi.fn();
    render(
      <CustomRange
        selected
        from="2026-11-15"
        to="2026-11-22"
        onApply={onApply}
      />,
    );
    expect(screen.getByText("Nov 15 – Nov 22")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Nov 15 – Nov 22" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith("2026-11-15", "2026-11-22");
  });

  it("does not enable Apply for an inverted range", () => {
    const invalid = (from: string, to: string) =>
      from === "" || to === "" || from > to;
    expect(invalid("2026-11-22", "2026-11-15")).toBe(true);
  });
});
