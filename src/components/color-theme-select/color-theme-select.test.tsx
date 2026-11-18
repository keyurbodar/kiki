import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ColorThemeSwatch } from "./color-theme-swatch";
import { toCustomColorThemes } from "./use-color-theme-options";

afterEach(cleanup);

describe("color theme select", () => {
  it("carries each custom theme's palette into the choice it stores", () => {
    const ink = (hex: string) => ({ kind: "literal" as const, hex });
    const palette = (background: string, foreground: string) => ({
      background: ink(background),
      foreground: ink(foreground),
      text: ink(foreground),
      accent: ink("#3b5de8"),
      accentText: ink("#ffffff"),
      shaderInk: ink("#778abd"),
    });
    const [choice] = toCustomColorThemes([
      {
        id: "t1",
        name: "Dusk",
        light: palette("#f2f2f4", "#1e1e20"),
        dark: palette("#09090a", "#ebebec"),
      },
      { id: "t2", name: "No palette" },
      { id: 2, name: "Bad" },
      null,
    ]);
    if (choice === undefined) throw new Error("expected a custom choice");
    expect(choice.kind).toBe("custom");
    expect(choice.id).toBe("t1");
    expect(choice.name).toBe("Dusk");
    expect(choice.css).toContain('[data-color-theme="custom"]:not(.dark)');
    expect(choice.css).toContain('.dark[data-color-theme="custom"]');
    expect(choice.css).toContain("#f2f2f4");
    expect(choice.css).toContain("#09090a");
    expect(toCustomColorThemes([{ id: "t2", name: "No palette" }])).toEqual([]);
    expect(toCustomColorThemes(undefined)).toEqual([]);
  });

  it("scopes the swatch to the theme it previews", () => {
    const { container } = render(
      <>
        <ColorThemeSwatch theme={{ kind: "preset", id: "gruvbox" }} dark />
        <ColorThemeSwatch theme={{ kind: "default" }} dark={false} />
      </>,
    );
    const [preset, capy] = container.querySelectorAll("span");
    expect(preset?.dataset.colorTheme).toBe("gruvbox");
    expect(preset?.classList.contains("dark")).toBe(true);
    expect(capy?.dataset.colorThemePreview).toBe("default");
    expect(capy?.classList.contains("dark")).toBe(false);
  });
});
