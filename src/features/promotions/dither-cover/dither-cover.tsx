import { useEffect, useRef } from "react";
import { CapyMark } from "@/components/capy-logo";
import { DITHER_COVER } from "@/tokens/effects";
import {
  coverFrame,
  GRID,
  maskAlpha,
  rasterizeCoverage,
  resolveCssColor,
} from "./dither";

export type DitherCoverProps = {
  onDone: () => void;
  frozenAt?: number;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function DitherCover({ onDone, frozenAt }: DitherCoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const root = rootRef.current;
    const context = canvasRef.current?.getContext("2d");
    const svg = markRef.current?.querySelector("svg");
    if (!root || !context || !svg) return;
    const dark = document.documentElement.classList.contains("dark");
    const [r, g, b] = resolveCssColor(dark ? "--fg" : "--bg");
    const image = context.createImageData(GRID, GRID);
    const coverage = rasterizeCoverage(svg);
    let cancelled = false;
    let drawn: number | undefined;
    const draw = (reveal: number) => {
      if (reveal === drawn) return;
      drawn = reveal;
      coverage.then((values) => {
        if (cancelled) return;
        const alpha = maskAlpha(values, reveal);
        for (let i = 0; i < alpha.length; i++) {
          image.data[i * 4] = r;
          image.data[i * 4 + 1] = g;
          image.data[i * 4 + 2] = b;
          image.data[i * 4 + 3] = alpha[i] ?? 0;
        }
        context.putImageData(image, 0, 0);
      });
    };
    const render = (elapsed: number) => {
      const frame = coverFrame(elapsed);
      root.style.opacity = String(frame.opacity);
      draw(frame.reveal);
    };

    if (frozenAt !== undefined) {
      render(frozenAt);
      return () => {
        cancelled = true;
      };
    }

    if (prefersReducedMotion()) {
      draw(1);
      root.style.opacity = "0";
      const raf = requestAnimationFrame(() => {
        root.style.opacity = "1";
      });
      const fadeOut = window.setTimeout(() => {
        root.style.opacity = "0";
      }, DITHER_COVER.reducedHideMs);
      const done = window.setTimeout(
        () => onDoneRef.current(),
        DITHER_COVER.reducedTotalMs,
      );
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.clearTimeout(fadeOut);
        window.clearTimeout(done);
      };
    }

    let start: number | undefined;
    let raf = 0;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      render(elapsed);
      if (elapsed >= DITHER_COVER.totalMs) onDoneRef.current();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [frozenAt]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-slot="dither-cover"
      className="fixed inset-0 z-(--z-tooltip) overflow-hidden bg-foreground motion-reduce:transition-opacity motion-reduce:duration-slow dark:bg-background"
    >
      <span ref={markRef} className="absolute size-0 overflow-hidden">
        <CapyMark className="h-10" />
      </span>
      <canvas
        ref={canvasRef}
        width={GRID}
        height={GRID}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 [image-rendering:pixelated]"
        style={{ width: DITHER_COVER.markSize, height: DITHER_COVER.markSize }}
      />
    </div>
  );
}
