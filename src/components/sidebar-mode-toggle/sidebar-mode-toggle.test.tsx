import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarModeToggle } from "./sidebar-mode-toggle";

afterEach(cleanup);

describe("SidebarModeToggle", () => {
  it("renders the sidebar-mode group with Captains then Threads", () => {
    const { container } = render(<SidebarModeToggle />);
    const group = container.querySelector('[data-slot="sidebar-mode"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Sidebar");
    expect(
      screen
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Captains", "Threads"]);
    expect(
      screen
        .getByRole("button", { name: "Threads" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("switches its own mode when uncontrolled", () => {
    const onModeChange = vi.fn();
    render(<SidebarModeToggle onModeChange={onModeChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Captains" }));
    const captains = screen.getByRole("button", { name: "Captains" });
    expect(captains.hasAttribute("data-selected")).toBe(true);
    expect(onModeChange).toHaveBeenCalledWith("captains");
  });

  it("follows the mode prop when controlled", () => {
    const onModeChange = vi.fn();
    render(<SidebarModeToggle mode="captains" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Threads" }));
    expect(onModeChange).toHaveBeenCalledWith("threads");
    expect(
      screen
        .getByRole("button", { name: "Captains" })
        .hasAttribute("data-selected"),
    ).toBe(true);
  });
});
