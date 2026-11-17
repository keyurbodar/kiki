import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandMenuSearch } from "./command-menu-search";
import { emptySearchData } from "./search";

afterEach(cleanup);

describe("CommandMenuSearch", () => {
  it("switches category with the arrow keys and composes on Tab", () => {
    const onCompose = vi.fn();
    render(<CommandMenuSearch data={emptySearchData} onCompose={onCompose} />);
    const input = screen.getByPlaceholderText(
      "Search threads, actions, settings…",
    );
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(screen.getByPlaceholderText("Search Captains…")).toBeTruthy();
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(screen.getByPlaceholderText("Search settings…")).toBeTruthy();
    fireEvent.keyDown(input, { key: "Tab" });
    expect(onCompose).toHaveBeenCalledWith({ query: "", seed: "" });
  });

  it("offers New thread for a query with no results", () => {
    render(<CommandMenuSearch data={emptySearchData} initialQuery="zzzqqq" />);
    expect(screen.getByText("New thread: zzzqqq")).toBeTruthy();
  });

  it("closes on Escape", () => {
    const close = vi.fn();
    render(<CommandMenuSearch data={emptySearchData} close={close} />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(close).toHaveBeenCalled();
  });
});
