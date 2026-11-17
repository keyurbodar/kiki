import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { readColorMode } from "@/lib/appearance";
import { AppearanceMenu } from "./appearance-menu";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

it("opens Mode and Color theme and switches the mode", async () => {
  render(<AppearanceMenu />);
  fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
  expect(await screen.findByText("Mode")).toBeTruthy();
  expect(screen.getByText("Color theme")).toBeTruthy();
  expect(screen.getByText("System")).toBeTruthy();
  expect(screen.getByText("Capy")).toBeTruthy();
  fireEvent.click(screen.getByText("Mode"));
  fireEvent.click(await screen.findByText("Dark"));
  expect(readColorMode()).toBe("dark");
});
