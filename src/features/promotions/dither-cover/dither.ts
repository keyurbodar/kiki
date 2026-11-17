import { DITHER_COVER } from "@/tokens/effects";

export const GRID = DITHER_COVER.grid;

export const bayerThreshold = (x: number, y: number) =>
  ((DITHER_COVER.bayer8[(y & 7) * 8 + (x & 7)] ?? 0) + 0.5) / 64;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const easeOutQuad = (t: number) => 1 - (1 - t) ** 2;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

export function coverFrame(elapsed: number) {
  return {
    reveal: easeOutQuad(
      clamp01((elapsed - DITHER_COVER.revealDelayMs) / DITHER_COVER.revealMs),
    ),
    opacity:
      1 -
      easeInOutCubic(
        clamp01(
          (elapsed - DITHER_COVER.fadeOutStartMs) / DITHER_COVER.fadeOutMs,
        ),
      ),
  };
}

export function maskAlpha(
  coverage: ArrayLike<number>,
  reveal: number,
): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(GRID * GRID);
  const half = GRID / 2;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const index = y * GRID + x;
      const distance = Math.hypot(x + 0.5 - half, y + 0.5 - half) / half;
      const level = clamp01(reveal * 1.7 - 0.6 * distance);
      alpha[index] =
        (coverage[index] ?? 0) >= 0.5 && level > bayerThreshold(x, y) ? 255 : 0;
    }
  }
  return alpha;
}

export function resolveCssColor(variable: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return [0, 0, 0];
  context.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

export function rasterizeCoverage(svg: SVGSVGElement): Promise<Float32Array> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(GRID));
  clone.setAttribute("height", String(GRID));
  clone.setAttribute("color", "black");
  const image = new Image(GRID, GRID);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return image.decode().then(() => {
    const coverage = new Float32Array(GRID * GRID);
    const canvas = document.createElement("canvas");
    canvas.width = GRID;
    canvas.height = GRID;
    const context = canvas.getContext("2d");
    if (!context) return coverage;
    context.drawImage(image, 0, 0, GRID, GRID);
    const { data } = context.getImageData(0, 0, GRID, GRID);
    for (let i = 0; i < coverage.length; i++) {
      coverage[i] = (data[i * 4 + 3] ?? 0) / 255;
    }
    return coverage;
  });
}
