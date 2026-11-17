import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  APPEARANCE_STORAGE_KEY,
  COLOR_THEME_STORAGE_KEY,
  colorThemeKey,
  colorThemeLabel,
  PRESET_COLOR_THEME_CHOICES,
  previewColorTheme,
  readColorMode,
  readColorTheme,
  sameColorTheme,
  setColorMode,
  setColorTheme,
} from "./appearance";

beforeEach(() => localStorage.clear());
afterEach(() => previewColorTheme(null));

describe("appearance storage", () => {
  it("reads Capy's stored mode and falls back to system", () => {
    expect(readColorMode()).toBe("system");
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ preferences: { mode: "dark" } }),
    );
    expect(readColorMode()).toBe("dark");
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "{not json");
    expect(readColorMode()).toBe("system");
  });

  it("reads preset and custom color themes and rejects unknown presets", () => {
    expect(readColorTheme()).toEqual({ kind: "default" });
    localStorage.setItem(
      COLOR_THEME_STORAGE_KEY,
      JSON.stringify({ kind: "preset", id: "gruvbox" }),
    );
    expect(readColorTheme()).toEqual({ kind: "preset", id: "gruvbox" });
    localStorage.setItem(
      COLOR_THEME_STORAGE_KEY,
      JSON.stringify({ kind: "preset", id: "nope" }),
    );
    expect(readColorTheme()).toEqual({ kind: "default" });
    localStorage.setItem(
      COLOR_THEME_STORAGE_KEY,
      JSON.stringify({ kind: "custom", id: "theme_1", name: "Dusk" }),
    );
    expect(readColorTheme()).toEqual({
      kind: "custom",
      id: "theme_1",
      name: "Dusk",
    });
  });

  it("keeps other preferences when the mode changes and applies it", () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ userId: "u", preferences: { effect: "dither" } }),
    );
    setColorMode("dark");
    expect(
      JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? ""),
    ).toEqual({
      userId: "u",
      preferences: { effect: "dither", mode: "dark" },
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    setColorMode("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies the selected theme and lets a preview override it", () => {
    setColorTheme({ kind: "preset", id: "github" });
    expect(document.documentElement.dataset.colorTheme).toBe("github");
    previewColorTheme({ kind: "preset", id: "linear" });
    expect(document.documentElement.dataset.colorTheme).toBe("linear");
    previewColorTheme(null);
    expect(document.documentElement.dataset.colorTheme).toBe("github");
    setColorTheme({ kind: "default" });
    expect(document.documentElement.dataset.colorTheme).toBeUndefined();
  });
});

describe("color theme choices", () => {
  it("lists Capy first, then every preset", () => {
    expect(PRESET_COLOR_THEME_CHOICES[0]).toEqual({ kind: "default" });
    expect(PRESET_COLOR_THEME_CHOICES.map(colorThemeLabel)).toContain("OLED");
  });

  it("keys, labels and compares themes", () => {
    const custom = { kind: "custom", id: "t1", name: "Dusk" } as const;
    expect(colorThemeKey({ kind: "default" })).toBe("default");
    expect(colorThemeKey({ kind: "preset", id: "one" })).toBe("preset:one");
    expect(colorThemeKey(custom)).toBe("custom:t1");
    expect(colorThemeLabel({ kind: "default" })).toBe("Capy");
    expect(colorThemeLabel(custom)).toBe("Dusk");
    expect(sameColorTheme(custom, { ...custom, name: "Renamed" })).toBe(true);
    expect(sameColorTheme({ kind: "default" }, custom)).toBe(false);
  });
});
