import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ColorThemeSwatch } from "./color-theme-swatch";
import { toCustomColorThemes } from "./use-color-theme-options";

afterEach(cleanup);

describe("color theme select", () => {
  it("keeps only well-formed custom themes", () => {
    expect(
      toCustomColorThemes([
        { id: "t1", name: "Dusk", colors: {} },
        { id: 2, name: "Bad" },
        null,
      ]),
    ).toEqual([{ kind: "custom", id: "t1", name: "Dusk" }]);
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
