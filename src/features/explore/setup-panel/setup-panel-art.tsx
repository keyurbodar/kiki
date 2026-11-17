import { useEffect, useState } from "react";
import { accentInk, DITHER_ALPHA, DITHER_CELL, ditherPixels } from "./accent";

type Grid = { cols: number; rows: number };

const readInk = (element: HTMLElement) => {
  const value = getComputedStyle(element)
    .getPropertyValue("--shader-ink")
    .trim();
  return value === "" ? null : value;
};

export type SetupPanelArtProps = { accent: string | null };

export function SetupPanelArt({ accent }: SetupPanelArtProps) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<Grid>();

  useEffect(() => {
    if (canvas === null) return;
    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const cols = Math.max(1, Math.ceil(width / DITHER_CELL));
      const rows = Math.max(1, Math.ceil(height / DITHER_CELL));
      setGrid((current) =>
        current?.cols === cols && current.rows === rows
          ? current
          : { cols, rows },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvas]);

  useEffect(() => {
    const context = canvas?.getContext("2d");
    if (canvas == null || context == null || grid === undefined) return;
    const paint = () => {
      const dark = document.documentElement.classList.contains("dark");
      const image = context.createImageData(grid.cols, grid.rows);
      image.data.set(
        ditherPixels(
          grid.cols,
          grid.rows,
          accentInk(accent, readInk(canvas), dark),
          dark ? DITHER_ALPHA.dark : DITHER_ALPHA.light,
        ),
      );
      context.putImageData(image, 0, 0);
    };
    paint();
    const observer = new MutationObserver(paint);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-color-theme"],
    });
    return () => observer.disconnect();
  }, [accent, canvas, grid]);

  return (
    <canvas
      ref={setCanvas}
      aria-hidden
      width={grid?.cols ?? 1}
      height={grid?.rows ?? 1}
      className="ph-no-capture pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]"
    />
  );
}
