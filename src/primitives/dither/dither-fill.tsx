import { cx } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { DITHER_FILL } from "@/tokens/effects";

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const density = (depth: number, peak: number, floor: number) =>
  (peak - floor) * (1 - depth) ** DITHER_FILL.falloff + floor;

export type DitherFillProps = {
  /** Series values in 0-1, left to right; null leaves a gap. */
  fractions: ReadonlyArray<number | null>;
  className?: string;
  /** Fill density right under the line. */
  peak?: number;
  /** Fill density at the bottom edge. */
  floor?: number;
};

/** Capy's sparkline: a hairline over an ordered 4x4 Bayer fill, drawn in currentColor. */
export function DitherFill({
  fractions,
  className,
  peak = DITHER_FILL.peak,
  floor = DITHER_FILL.floor,
}: DitherFillProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    const { bayer, cell, fillAlpha } = DITHER_FILL;
    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (width === 0 || height === 0) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      if (fractions.length === 0) return;
      const color = getComputedStyle(canvas).color;
      const span = height - 2;
      const lineY = (x: number) => {
        if (fractions.length === 1) {
          const only = fractions[0];
          return only == null ? null : 1 + (1 - clamp01(only)) * span;
        }
        const pos = (x / width) * (fractions.length - 1);
        const i = Math.min(Math.floor(pos), fractions.length - 2);
        const a = fractions[i];
        const b = fractions[i + 1];
        if (a == null || b == null) return null;
        const t = pos - i;
        return 1 + (1 - (clamp01(a) + (clamp01(b) - clamp01(a)) * t)) * span;
      };
      ctx.fillStyle = color;
      ctx.globalAlpha = fillAlpha;
      for (let x = 0; x < width; x += cell) {
        const top = lineY(x + cell / 2);
        if (top === null) continue;
        for (let y = 0; y < height; y += cell) {
          if (y + cell / 2 < top) continue;
          const depth = (y + cell / 2 - top) / Math.max(height - top, 1);
          const threshold =
            ((bayer[(y / cell) % 4]?.[(x / cell) % 4] ?? 0) + 0.5) / 16;
          if (density(depth, peak, floor) > threshold)
            ctx.fillRect(x, y, cell, cell);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      let drawing = false;
      fractions.forEach((value, i) => {
        if (value === null) {
          drawing = false;
          return;
        }
        const x =
          fractions.length > 1 ? (i / (fractions.length - 1)) * width : width;
        const y = 1 + (1 - clamp01(value)) * span;
        if (drawing) ctx.lineTo(x, y);
        else {
          ctx.moveTo(x, y);
          drawing = true;
          if (fractions[i + 1] == null) ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };
    draw();
    const resize = new ResizeObserver(draw);
    resize.observe(canvas);
    return () => resize.disconnect();
  }, [fractions, peak, floor]);
  return (
    <canvas
      ref={ref}
      data-slot="dither-fill"
      className={cx("w-full text-primary", className)}
      aria-hidden
    />
  );
}
