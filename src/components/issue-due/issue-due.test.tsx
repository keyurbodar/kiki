import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DueRangeCalendar } from "./issue-due";

afterEach(cleanup);

const day = (date: number) =>
  screen
    .getAllByRole("button")
    .find(
      (button) =>
        button.textContent === String(date) &&
        button.className.includes("text-foreground"),
    );

describe("DueRangeCalendar", () => {
  it("picks the first day, then closes the range in order", () => {
    const onChange = vi.fn();
    render(
      <DueRangeCalendar
        from={null}
        to={null}
        today="2026-11-17"
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Pick the first day")).toBeTruthy();
    fireEvent.click(day(20) as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith("2026-11-20", "2026-11-20");
    expect(screen.getByText("Pick the last day")).toBeTruthy();
    fireEvent.click(day(10) as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith("2026-11-10", "2026-11-20");
  });

  it("offers Clear range once a range is set", () => {
    const onChange = vi.fn();
    render(
      <DueRangeCalendar
        from="2026-11-10"
        to="2026-11-20"
        today="2026-11-17"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("Clear range"));
    expect(onChange).toHaveBeenLastCalledWith(null, null);
  });

  it("moves between months", () => {
    render(
      <DueRangeCalendar
        from={null}
        to={null}
        today="2026-11-17"
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Next month"));
    expect(
      screen
        .getAllByRole("button")
        .some((b) => b.getAttribute("aria-label")?.includes("December")),
    ).toBe(true);
  });
});
