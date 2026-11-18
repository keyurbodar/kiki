import type { ColorTheme } from "@/tokens/theme";
import {
  COLOR_VARS,
  type Palette,
  type PaletteSide,
  REQUIRED_COLOR_KEYS,
} from "./palette";

/** True for a colour the browser can parse — "" and "Derived" are not colours. */
export const isColor = (color: string): boolean =>
  color.trim() !== "" &&
  (typeof CSS === "undefined" || typeof CSS.supports !== "function"
    ? true
    : CSS.supports("color", color.trim()));

let canvas: CanvasRenderingContext2D | null | undefined;

/**
 * Normalises any CSS colour the browser understands to #rrggbb. Painting one
 * pixel and reading it back is the only way that also covers the colour spaces
 * `fillStyle` keeps verbatim — Capy's default theme is written in the oklch
 * colour space, and a string round-trip hands that syntax back, not a hex.
 */
export const toHex = (color: string): string | undefined => {
  canvas ??= document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!canvas) return undefined;
  if (!isColor(color)) return undefined;
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = color.trim();
  canvas.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 0] = canvas.getImageData(
    0,
    0,
    1,
    1,
  ).data;
  if (alpha === 0) return undefined;
  const byte = (value: number) =>
    value.toString(16).padStart(2, "0").toLowerCase();
  return `#${byte(red)}${byte(green)}${byte(blue)}`;
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
      toHex(resolved) ??
      toHex(computed.getPropertyValue(COLOR_VARS[key]).trim());
    return [key, { kind: "literal", hex: hex ?? "" }] as const;
  });
  probe.remove();
  return Object.fromEntries(entries) as unknown as Palette;
}
