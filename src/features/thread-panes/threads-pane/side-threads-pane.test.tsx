import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SideThreadsPane } from "./side-threads-pane";

afterEach(cleanup);

const sideThreads = [
  { id: "jam_a", label: "Stub the payment gateway" },
  { id: "jam_b", label: "Add a retry budget" },
];

describe("SideThreadsPane", () => {
  it("renders the menu rows inside a menu root", () => {
    render(
      <SideThreadsPane
        sideThreads={sideThreads}
        onOpen={() => {}}
        onBack={() => {}}
        onNewSideThread={() => {}}
        newSideThreadShortcut="⇧⌘S"
      />,
    );
    const menu = screen.getByRole("menu");
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Side threads",
      "New side thread⇧⌘S",
      "Stub the payment gateway",
      "Add a retry budget",
    ]);
    expect(items.every((item) => menu.contains(item))).toBe(true);
  });

  it("opens a side thread from its row", () => {
    const onOpen = vi.fn();
    render(
      <SideThreadsPane
        sideThreads={sideThreads}
        onOpen={onOpen}
        onBack={() => {}}
      />,
    );
    expect(screen.queryByText("New side thread")).toBeNull();
    fireEvent.click(screen.getByText("Add a retry budget"));
    expect(onOpen).toHaveBeenCalledWith(sideThreads[1]);
  });
});
