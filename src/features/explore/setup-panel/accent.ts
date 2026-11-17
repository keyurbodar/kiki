const MIN_CHROMA = 0.04;

export const DITHER_CELL = 3;
export const DITHER_ALPHA = { dark: 150, light: 120 } as const;

type Oklch = { lightness: number; chroma: number; hue: number };

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const toGamma = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
};

const linearToOklch = (r: number, g: number, b: number): Oklch => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    chroma: Math.hypot(a, bb),
    hue: ((((Math.atan2(bb, a) * 180) / Math.PI) % 360) + 360) % 360,
  };
};

const hexToOklch = (hex: string) => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) =>
    toLinear(Number.parseInt(hex.slice(start, start + 2), 16)),
  );
  return linearToOklch(r, g, b);
};

const oklchToLinear = (lightness: number, chroma: number, hue: number) => {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const outOfGamut = (rgb: number[]) =>
  rgb.some((channel) => channel < -1e-4 || channel > 1.0001);

const inGamutRgb = (lightness: number, chroma: number, hue: number) => {
  const steps = Array.from(
    { length: Math.ceil(chroma / 0.002) + 1 },
    (_, step) => Math.max(chroma - step * 0.002, 0),
  );
  const fit =
    steps.find(
      (candidate) =>
        candidate === 0 ||
        !outOfGamut(oklchToLinear(lightness, candidate, hue)),
    ) ?? 0;
  return oklchToLinear(lightness, fit, hue).map((channel) =>
    Math.round(toGamma(channel) * 255),
  );
};

const isHexColour = (value: string | null): value is string =>
  value !== null && /^#[0-9a-f]{6}$/i.test(value);

export function accentInk(
  accent: string | null,
  shaderInk: string | null,
  dark: boolean,
) {
  const tint = [accent, shaderInk]
    .filter(isHexColour)
    .map(hexToOklch)
    .find((colour) => colour.chroma >= MIN_CHROMA);
  return tint === undefined
    ? inGamutRgb(dark ? 0.5 : 0.75, 0, 0)
    : inGamutRgb(
        dark ? 0.6 : 0.7,
        Math.min(tint.chroma, dark ? 0.16 : 0.14),
        tint.hue,
      );
}

const BAYER = Array.from({ length: 64 }, (_, index) => {
  const x = index % 8;
  const y = Math.floor(index / 8);
  return [0, 1, 2].reduce(
    (value, bit) =>
      value |
      ((((x ^ y) >> bit) & 1) << (5 - 2 * bit)) |
      (((y >> bit) & 1) << (4 - 2 * bit)),
    0,
  );
});

const coverage = (x: number, y: number) => {
  const t = Math.min(Math.max((0.8 * x + 0.2 * y - 0.42) / 0.58, 0), 1);
  return t * t * (3 - 2 * t) * 0.8;
};

export function ditherPixels(
  cols: number,
  rows: number,
  rgb: number[],
  alpha: number,
) {
  const [r = 0, g = 0, b = 0] = rgb;
  const pixels = new Uint8ClampedArray(cols * rows * 4);
  for (let index = 0; index < cols * rows; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const lit =
      coverage(col / cols, row / rows) >
      ((BAYER[(row % 8) * 8 + (col % 8)] ?? 0) + 0.5) / 64;
    if (lit) pixels.set([r, g, b, alpha], index * 4);
  }
  return pixels;
}
