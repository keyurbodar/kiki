export const BACKGROUND_EFFECTS = [
  "none",
  "dither",
  "grain",
  "vignette",
] as const;
export type BackgroundEffect = (typeof BACKGROUND_EFFECTS)[number];

export const BACKGROUND_EFFECT_LABELS: Record<BackgroundEffect, string> = {
  none: "None",
  dither: "Dither",
  grain: "Grain",
  vignette: "Vignette",
};

export const DEFAULT_BACKGROUND_EFFECT: BackgroundEffect = "dither";

/* Fallbacks Capy uses when --shader-ink can't be read. */
export const SHADER_INK_FALLBACK = "#778abd";
export const SHADER_MONO_FALLBACK = "#8c8c8c";

/* Dashboard wallpaper dither (image shader). */
export const WALLPAPER_DITHER = {
  type: "8x8",
  size: 2,
  colorSteps: 4,
  originalColors: true,
  fit: "cover",
  minPixelRatio: 1,
} as const;

/* The WebGL context Paper's image shader is mounted with. */
export const DITHER_CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
} as const;

/* Dither-fill sparkline: ordered 4x4 Bayer fill under a line chart. */
export const DITHER_FILL = {
  bayer: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ],
  cell: 2,
  peak: 0.5,
  floor: 0.02,
  falloff: 1.6,
  fillAlpha: 0.55,
} as const;

/* Dither-cover: the 64px capy-mark reveal shown over the app on first load. */
export const DITHER_COVER = {
  bayer8: [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
    14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55,
    23, 61, 29, 53, 21,
  ],
  pixelSize: 3,
  markSize: "27.5dvh",
  fabricLighten: 0.18,
  grid: 64,
  fabricFrame: 4e4,
  fabricSpeed: 0.5,
  fabricInMs: 300,
  revealDelayMs: 300,
  revealMs: 1100,
  fadeOutStartMs: 3000,
  fadeOutMs: 800,
  totalMs: 3800,
  reducedFadeMs: 300,
  reducedHideMs: 1900,
  reducedTotalMs: 2200,
  shape: "simplex",
  type: "8x8",
  scale: 2,
} as const;
