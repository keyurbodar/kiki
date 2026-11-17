import { beforeEach, expect, it } from "vitest";
import {
  APPEARANCE_KEY,
  readStoredColorMode,
  syncColorMode,
} from "./color-mode";

beforeEach(() => localStorage.clear());

it("reads Capy's stored appearance mode", () => {
  expect(readStoredColorMode()).toBe("system");
  localStorage.setItem(APPEARANCE_KEY, "{bad");
  expect(readStoredColorMode()).toBe("system");
  localStorage.setItem(
    APPEARANCE_KEY,
    JSON.stringify({ preferences: { mode: "dark" } }),
  );
  expect(readStoredColorMode()).toBe("dark");
});

it("applies the dark class and colour scheme", () => {
  const root = document.createElement("html");
  localStorage.setItem(
    APPEARANCE_KEY,
    JSON.stringify({ preferences: { mode: "dark" } }),
  );
  syncColorMode(root);
  expect(root.classList.contains("dark")).toBe(true);
  expect(root.style.colorScheme).toBe("dark");
  localStorage.setItem(
    APPEARANCE_KEY,
    JSON.stringify({ preferences: { mode: "light" } }),
  );
  syncColorMode(root);
  expect(root.classList.contains("dark")).toBe(false);
});
