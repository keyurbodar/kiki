import { useEffect, useRef, useState } from "react";
import { CapyMark } from "@/primitives/brand/capy-mark";
import { DITHER_COVER } from "@/tokens/effects";
import { DitherShader } from "./dither-shader";
import SHADER_COLORS from "./shader-colors.json";
import {
  resolveShaderColor,
  useShaderEnvironment,
} from "./use-shader-environment";

const GRID = DITHER_COVER.grid;
const CELLS = GRID * GRID;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeOutQuad = (t: number) => 1 - (1 - t) ** 2;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const bayer = (x: number, y: number) =>
  ((DITHER_COVER.bayer8[(y & 7) * 8 + (x & 7)] ?? 0) + 0.5) / 64;

/** Mix a #rrggbb colour toward white by `amount`. */
function lighten(hex: string, amount: number) {
  return `#${[1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    .map((v) =>
      Math.round(v + (255 - v) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Rasterise the mark's SVG into a GRID x GRID alpha mask. */
function rasterise(svg: SVGElement): Promise<Float32Array> {
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("width", String(GRID));
  clone.setAttribute("height", String(GRID));
  clone.setAttribute("color", "black");
  const image = new Image(GRID, GRID);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return image.decode().then(() => {
    const canvas = document.createElement("canvas");
    canvas.width = GRID;
    canvas.height = GRID;
    const ctx = canvas.getContext("2d");
    const mask = new Float32Array(CELLS);
    if (!ctx) return mask;
    ctx.drawImage(image, 0, 0, GRID, GRID);
    const { data } = ctx.getImageData(0, 0, GRID, GRID);
    for (let i = 0; i < CELLS; i++) mask[i] = (data[i * 4 + 3] ?? 0) / 255;
    return mask;
  });
}

/** Paint the mark revealed to `progress` (0-1) as a radial Bayer wipe from the centre. */
function paint(
  ctx: CanvasRenderingContext2D,
  frame: ImageData,
  mask: Float32Array,
  progress: number,
) {
  const { data } = frame;
  const half = GRID / 2;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const i = y * GRID + x;
      const distance = Math.hypot(x + 0.5 - half, y + 0.5 - half) / half;
      const reveal = clamp01(progress * 1.7 - 0.6 * distance);
      data[i * 4 + 3] = (mask[i] ?? 0) >= 0.5 && reveal > bayer(x, y) ? 255 : 0;
    }
  ctx.putImageData(frame, 0, 0);
}

type CoverColors = { base: string; fabric: string; ink: string };

export type DitherCoverProps = {
  /** Called once the cover has faded out. */
  onDone: () => void;
  /** Freeze the timeline at this many milliseconds (specimens, screenshots). */
  frozenAt?: number;
};

/**
 * Capy's first-load cover: a full-screen plate in the foreground colour with a
 * drifting dither fabric, the capy mark dithering in from the centre, then a fade.
 */
export function DitherCover({ onDone, frozenAt }: DitherCoverProps) {
  const { ready, reducedMotion } = useShaderEnvironment();
  const rootRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const [colors, setColors] = useState<CoverColors | null>(null);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    const base = resolveShaderColor(dark ? "var(--bg)" : "var(--fg)");
    const ink = resolveShaderColor(dark ? "var(--fg)" : "var(--bg)");
    if (base === undefined || ink === undefined) return;
    setColors({ base, fabric: lighten(base, DITHER_COVER.fabricLighten), ink });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const svg = markRef.current?.querySelector("svg");
    if (!colors || !root || !canvas || !svg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mask = rasterise(svg);
    const frame = ctx.createImageData(GRID, GRID);
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) =>
      Number.parseInt(colors.ink.slice(i, i + 2), 16),
    );
    for (let i = 0; i < CELLS; i++) {
      frame.data[i * 4] = r;
      frame.data[i * 4 + 1] = g;
      frame.data[i * 4 + 2] = b;
    }
    const d = DITHER_COVER;
    if (reducedMotion) {
      mask.then((m) => paint(ctx, frame, m, 1));
      root.style.transition = `opacity ${d.reducedFadeMs}ms ease`;
      root.style.opacity = "0";
      requestAnimationFrame(() => {
        root.style.opacity = "1";
      });
      const hide = window.setTimeout(() => {
        root.style.opacity = "0";
      }, d.reducedHideMs);
      const done = window.setTimeout(
        () => onDoneRef.current(),
        d.reducedTotalMs,
      );
      return () => {
        window.clearTimeout(hide);
        window.clearTimeout(done);
      };
    }
    let raf = 0;
    let cancelled = false;
    let lastProgress = "";
    const fabric = fabricRef.current;
    const render = (t: number) => {
      const progress = easeOutQuad(clamp01((t - d.revealDelayMs) / d.revealMs));
      const fade = easeInOutCubic(
        clamp01((t - d.fadeOutStartMs) / d.fadeOutMs),
      );
      root.style.opacity = String(1 - fade);
      if (fabric)
        fabric.style.opacity = String(easeOutCubic(clamp01(t / d.fabricInMs)));
      const key = String(progress);
      if (key === lastProgress) return;
      lastProgress = key;
      mask.then((m) => {
        if (!cancelled) paint(ctx, frame, m, progress);
      });
    };
    if (frozenAt !== undefined) {
      const loop = () => {
        render(frozenAt);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }
    let start: number | null = null;
    const loop = (now: number) => {
      if (
        start === null &&
        ready &&
        !fabricRef.current?.querySelector("canvas")
      ) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (start === null) start = now;
      const t = now - start;
      render(t);
      if (t >= d.totalMs) onDoneRef.current();
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [colors, ready, reducedMotion, frozenAt]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-slot="dither-cover"
      className="fixed inset-0 z-(--z-tooltip) overflow-hidden"
      style={{ backgroundColor: colors?.base ?? "var(--fg)" }}
    >
      <span ref={markRef} className="absolute size-0 overflow-hidden">
        <CapyMark className="h-10" />
      </span>
      {ready && colors && !reducedMotion ? (
        <div ref={fabricRef} className="pointer-events-none absolute inset-0">
          <DitherShader
            animate
            frame={DITHER_COVER.fabricFrame}
            animationSpeed={DITHER_COVER.fabricSpeed}
            colorBack={SHADER_COLORS.transparent}
            colorFront={colors.fabric}
            shape={DITHER_COVER.shape}
            type={DITHER_COVER.type}
            size={DITHER_COVER.pixelSize}
            scale={DITHER_COVER.scale}
          />
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={GRID}
        height={GRID}
        className="pointer-events-none absolute top-1/2 left-1/2 [image-rendering:pixelated]"
        style={{
          width: DITHER_COVER.markSize,
          height: DITHER_COVER.markSize,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
