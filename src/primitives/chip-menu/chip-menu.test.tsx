import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChipMenu, ChipMenuTrigger } from "./chip-menu";

afterEach(cleanup);

const options = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const openMenu = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Effort" }));
  return screen.findByRole("menu");
};

describe("ChipMenu", () => {
  it("shows the prefix and the current option's label", () => {
    render(
      <ChipMenu
        ariaLabel="Effort"
        prefix="Effort"
        current="medium"
        options={options}
        onPick={() => {}}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Effort" });
    expect(trigger.textContent).toBe("EffortMedium");
  });

  it("falls back to the raw value when it is not an option", () => {
    render(
      <ChipMenu
        ariaLabel="Effort"
        current="max"
        options={options}
        onPick={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Effort" }).textContent).toBe(
      "max",
    );
  });

  it("checks the current option and picks on click", async () => {
    const onPick = vi.fn();
    render(
      <ChipMenu
        ariaLabel="Effort"
        current="low"
        options={options}
        onPick={onPick}
      />,
    );
    const menu = await openMenu();
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Low",
      "Medium",
      "High",
    ]);
    expect(items[0]?.querySelector('[data-icon="checkmark-1"]')).not.toBeNull();
    expect(items[1]?.querySelector('[data-icon="checkmark-1"]')).toBeNull();
    fireEvent.click(items[2] as HTMLElement);
    expect(onPick).toHaveBeenCalledWith("high");
  });

  it("filters with the search box, shows No results and picks the top hit on Enter", async () => {
    const onPick = vi.fn();
    render(
      <ChipMenu
        ariaLabel="Effort"
        current="low"
        options={options}
        onPick={onPick}
        searchPlaceholder="Search effort"
      />,
    );
    const menu = await openMenu();
    const search = within(menu).getByLabelText("Search effort");
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(within(menu).getByText("No results")).toBeDefined();
    fireEvent.change(search, { target: { value: "hi" } });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["High"]);
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onPick).toHaveBeenCalledWith("high");
  });

  it("ignores Enter on an empty search", async () => {
    const onPick = vi.fn();
    render(
      <ChipMenu
        ariaLabel="Effort"
        current="low"
        options={options}
        onPick={onPick}
        searchPlaceholder="Search effort"
      />,
    );
    const menu = await openMenu();
    fireEvent.keyDown(within(menu).getByLabelText("Search effort"), {
      key: "Enter",
    });
    expect(onPick).not.toHaveBeenCalled();
  });
});

describe("ChipMenu as a menu root", () => {
  it("still composes a custom trigger without options", () => {
    const onOpenChange = vi.fn();
    render(
      <ChipMenu onOpenChange={onOpenChange}>
        <ChipMenuTrigger>Open</ChipMenuTrigger>
      </ChipMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.dataset.slot).toBe("menu-trigger");
    fireEvent.click(trigger);
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
  });
});
