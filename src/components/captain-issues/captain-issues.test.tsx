import { RegistryProvider } from "@effect/atom-react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type CaptainIssuesListProps,
  CaptainIssuesView,
} from "./captain-issues";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderView = (list?: (props: CaptainIssuesListProps) => null) =>
  render(
    <RegistryProvider>
      <CaptainIssuesView jamId="jam_sample_captain" list={list} />
    </RegistryProvider>,
  );

describe("CaptainIssuesView", () => {
  it("shows the view tabs and the All view's empty copy", () => {
    renderView();
    for (const label of ["All", "Assigned to me", "Mentioned"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(screen.getByText("No issues for this crew yet")).toBeTruthy();
  });

  it("switches views and their empty copy", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Assigned to me" }));
    expect(
      screen.getByText("Nothing in this crew is assigned to you"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Assigned to me" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("opens search, debounces the query and closes on Escape", () => {
    vi.useFakeTimers();
    const list = vi.fn((_props: CaptainIssuesListProps) => null);
    renderView(list);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    const input = screen.getByLabelText("Search issues");
    expect(screen.getByRole("button", { name: "Close search" })).toBeTruthy();
    fireEvent.change(input, { target: { value: " retry " } });
    expect(list.mock.lastCall?.[0].emptyText).toBe(
      "No issues for this crew yet",
    );
    act(() => vi.advanceTimersByTime(300));
    expect(list.mock.lastCall?.[0].emptyText).toBe("No matching issues");
    expect(list.mock.lastCall?.[0].filtersKey).toContain("retry");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByLabelText("Search issues")).toBeNull();
    expect(list.mock.lastCall?.[0].filtersKey).toBe("");
  });
});
