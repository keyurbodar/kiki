import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appearanceActions,
  colorThemeKey,
  colorThemeLabel,
  getAppearance,
} from "./appearance-store";
import { literal } from "./palette";

const palette = {
  background: literal("#101010"),
  foreground: literal("#fafafa"),
  text: literal("#fafafa"),
  accent: literal("#3366ff"),
  accentText: literal("#ffffff"),
  shaderInk: literal("#3366ff"),
};

describe("appearance store", () => {
  beforeEach(() => {
    localStorage.clear();
    appearanceActions.reset();
  });
  afterEach(() => {
    document.documentElement.className = "";
    delete document.documentElement.dataset.colorTheme;
    document.getElementById("capy-custom-theme")?.remove();
  });

  it("defaults to system mode, the Capy theme and red/green diffs", () => {
    const state = getAppearance();
    expect(state.preferences.mode).toBe("system");
    expect(state.colorTheme).toEqual({ kind: "default" });
    expect(colorThemeLabel(state.colorTheme)).toBe("Capy");
    expect(state.diffColors).toBe("red-green");
    expect(state.syncMode).toBe("synced");
  });

  it("writes Capy's storage keys and applies mode and preset to <html>", () => {
    appearanceActions.updatePreferences({ mode: "dark" });
    appearanceActions.selectColorTheme({ kind: "preset", id: "gruvbox" });
    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.dataset.colorTheme).toBe("gruvbox");
    expect(
      JSON.parse(localStorage.getItem("capy-web:color-theme-v2") ?? ""),
    ).toEqual({
      kind: "preset",
      id: "gruvbox",
    });
    expect(
      JSON.parse(localStorage.getItem("capy-web:appearance") ?? "").preferences
        .mode,
    ).toBe("dark");
    expect(colorThemeKey(getAppearance().colorTheme)).toBe("preset:gruvbox");
  });

  it("injects a style element for a custom theme and removes it after", () => {
    appearanceActions.selectColorTheme({
      kind: "custom",
      id: "theme_1",
      name: "Harbor",
      light: palette,
      dark: palette,
    });
    const style = document.getElementById("capy-custom-theme");
    expect(document.documentElement.dataset.colorTheme).toBe("custom");
    expect(style?.textContent).toContain('.dark[data-color-theme="custom"]');
    expect(style?.textContent).toContain("--primary: #3366ff;");
    appearanceActions.selectColorTheme({ kind: "default" });
    expect(document.getElementById("capy-custom-theme")).toBeNull();
    expect(document.documentElement.dataset.colorTheme).toBeUndefined();
  });

  it("toggles the blue/orange diff palette", () => {
    appearanceActions.setDiffColors("blue-orange");
    expect(document.documentElement.dataset.diffColors).toBe("blue-orange");
    appearanceActions.setDiffColors("red-green");
    expect(document.documentElement.dataset.diffColors).toBeUndefined();
  });
});
