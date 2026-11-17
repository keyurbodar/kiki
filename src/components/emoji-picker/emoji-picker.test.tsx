import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmojiPicker } from "./emoji-picker";

afterEach(cleanup);

const groups = [
  {
    name: "Animals & Nature",
    emojis: [
      { emoji: "🐶", name: "dog face" },
      { emoji: "🐱", name: "cat face" },
    ],
  },
];

describe("EmojiPicker", () => {
  it("shows the loading state until groups arrive", () => {
    render(<EmojiPicker groups={null} frequent={[]} />);
    expect(screen.getByText("Loading emoji")).toBeTruthy();
  });

  it("lists frequent emoji and groups, and picks one", () => {
    const onPick = vi.fn();
    render(<EmojiPicker groups={groups} frequent={["🐱"]} onPick={onPick} />);
    expect(screen.getByText("Frequently used")).toBeTruthy();
    expect(screen.getByText("Animals & nature")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "dog face" }));
    expect(onPick).toHaveBeenCalledWith("🐶");
  });

  it("says when nothing matches the search", () => {
    render(<EmojiPicker groups={groups} frequent={[]} />);
    fireEvent.change(screen.getByLabelText("Search emoji"), {
      target: { value: "zebra" },
    });
    expect(screen.getByText("No emoji match")).toBeTruthy();
  });

  it("submits a typed name and shows the returned error", () => {
    const onSubmit = vi.fn(() => "Name taken");
    render(<EmojiPicker groups={groups} frequent={[]} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("Search or type a name");
    fireEvent.change(input, { target: { value: "party" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("party");
    expect(screen.getByText("Name taken")).toBeTruthy();
  });
});
