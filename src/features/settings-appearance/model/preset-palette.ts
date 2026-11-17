import type { ColorTheme } from "@/tokens/theme";
import {
  COLOR_VARS,
  type Palette,
  type PaletteSide,
  REQUIRED_COLOR_KEYS,
} from "./palette";

let canvas: CanvasRenderingContext2D | null | undefined;

/** Normalises any CSS colour the browser understands to #rrggbb. */
export const toHex = (color: string): string | undefined => {
  canvas ??= document.createElement("canvas").getContext("2d");
  if (!canvas) return undefined;
  canvas.fillStyle = "black";
  canvas.fillStyle = color;
  const value = String(canvas.fillStyle);
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined;
};

/**
 * A preset's base colours, read back from the token CSS so the values live in
 * one place (src/tokens/themes). Used to seed "your own copy" of a preset.
 */
export function readPresetPalette(
  theme: ColorTheme,
  side: PaletteSide,
): Palette {
  const probe = document.createElement("span");
  probe.dataset.themePreview = side;
  if (theme === "default") probe.dataset.colorThemePreview = "default";
  else probe.dataset.colorTheme = theme;
  if (side === "dark") probe.className = "dark";
  probe.hidden = true;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const entries = REQUIRED_COLOR_KEYS.map((key) => {
    const probeColor = document.createElement("span");
    probeColor.style.color = `var(${COLOR_VARS[key]})`;
    probe.appendChild(probeColor);
    const resolved = getComputedStyle(probeColor).color;
    const hex =
      toHex(resolved) ?? toHex(computed.getPropertyValue(COLOR_VARS[key]).trim());
    return [key, { kind: "literal", hex: hex ?? "" }] as const;
  });
  probe.remove();
  return Object.fromEntries(entries) as unknown as Palette;
}
