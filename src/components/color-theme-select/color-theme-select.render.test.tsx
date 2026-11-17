import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { readColorTheme, useAppearance } from "@/lib/appearance";
import { ColorThemeSelect } from "./color-theme-select";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function Displayed() {
  const { colorTheme, displayedColorTheme } = useAppearance();
  return (
    <output>
      {colorTheme.kind === "preset" ? colorTheme.id : colorTheme.kind}/
      {displayedColorTheme.kind === "preset"
        ? displayedColorTheme.id
        : displayedColorTheme.kind}
    </output>
  );
}

it("saves a theme that was hovered before it was clicked", async () => {
  render(
    <>
      <ColorThemeSelect />
      <Displayed />
    </>,
  );
  fireEvent.click(screen.getByRole("combobox", { name: "Color theme" }));
  const option = await screen.findByRole("option", { name: /GitHub/ });
  fireEvent.pointerEnter(option, { pointerType: "mouse" });
  expect(screen.getByRole("status").textContent).toBe("default/github");
  expect(
    screen.getByRole("combobox", { name: "Color theme" }).textContent,
  ).toContain("Capy");
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.pointerUp(option, { pointerType: "mouse" });
  fireEvent.click(option);
  expect(readColorTheme()).toEqual({ kind: "preset", id: "github" });
  fireEvent.pointerLeave(option, { pointerType: "mouse" });
  expect(screen.getByRole("status").textContent).toBe("github/github");
});
