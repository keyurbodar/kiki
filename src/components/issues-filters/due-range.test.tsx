import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Menu, MenuContent } from "@/primitives/menu";
import { filtersForView } from "./filters";
import { DueFilterItems } from "./issues-filters";

afterEach(cleanup);

const renderDue = (onChange: (filters: unknown) => void, filters = {}) =>
  render(
    <Menu open>
      <MenuContent>
        <DueFilterItems
          filters={{ ...filtersForView("all"), ...filters }}
          onChange={onChange}
        />
      </MenuContent>
    </Menu>,
  );

describe("the due date filter", () => {
  it("keeps the relative buckets and adds a custom range", () => {
    renderDue(() => {});
    for (const label of ["Today", "Tomorrow", "This week", "Next week"])
      expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("Custom range")).toBeTruthy();
  });

  it("picks a range on the calendar and writes both ends", () => {
    const onChange = vi.fn();
    renderDue(onChange);
    fireEvent.click(screen.getByText("Custom range"));
    const days = screen.getAllByRole("button", { pressed: false });
    fireEvent.click(days[0]!);
    fireEvent.click(days[1]!);
    const last = onChange.mock.calls.at(-1)?.[0] as {
      dueFrom: string;
      dueTo: string;
    };
    expect(last.dueFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(last.dueTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shows the chosen range on the custom row", () => {
    renderDue(() => {}, { dueFrom: "2026-11-19", dueTo: "2026-11-25" });
    expect(screen.getByText("2026-11-19 – 2026-11-25")).toBeTruthy();
  });
});
