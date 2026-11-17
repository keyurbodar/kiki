import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandMenu } from "@/primitives/command-menu";
import { isPaletteToggle, PaletteInput } from "./parts";

describe("PaletteInput", () => {
  it("recognises Cmd+K and Ctrl+K as the palette toggle", () => {
    expect(
      isPaletteToggle(
        new KeyboardEvent("keydown", { key: "k", metaKey: true }),
      ),
    ).toBe(true);
    expect(
      isPaletteToggle(
        new KeyboardEvent("keydown", { key: "K", ctrlKey: true }),
      ),
    ).toBe(true);
    expect(isPaletteToggle(new KeyboardEvent("keydown", { key: "k" }))).toBe(
      false,
    );
  });

  it("stops ordinary shortcuts from bubbling", () => {
    render(
      <CommandMenu open>
        <PaletteInput placeholder="search" />
      </CommandMenu>,
    );
    const input = screen.getByPlaceholderText("search");
    const arrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    const stopped = vi.spyOn(arrow, "stopPropagation");
    fireEvent(input, arrow);
    expect(stopped).toHaveBeenCalled();
    cleanup();
  });
});
