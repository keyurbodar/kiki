import { type CSSProperties, Fragment, type ReactNode } from "react";
import type { MediaLayout } from "./classes";

const MIN_ASPECT = 3 / 4;
const MAX_ASPECT = 3;
const maxTiles = 4;

export type MediaSize = { width: number; height: number };

const clampAspect = (size: MediaSize) =>
  Math.min(Math.max(size.width / size.height, MIN_ASPECT), MAX_ASPECT);

export type JustifiedMediaGridProps = {
  count: number;
  /** The rendered size of each entry, when the file carries one. */
  sizes: ReadonlyArray<MediaSize | undefined>;
  tile: (
    index: number,
    layout: MediaLayout,
    more?: number,
    style?: CSSProperties,
  ) => ReactNode;
};

/**
 * Capy's justified gallery: rows share one height and each tile takes the
 * width its aspect asks for, so a mixed set of images reads as one block.
 * Falls back to the pair, hero-and-stack and 2×2 layouts when sizes are
 * missing.
 */
export function JustifiedMediaGrid({
  count,
  sizes,
  tile,
}: JustifiedMediaGridProps) {
  const aspects = sizes
    .slice(0, Math.min(count, maxTiles))
    .flatMap((size) => (size === undefined ? [] : [clampAspect(size)]));

  if (
    count >= 2 &&
    count !== 3 &&
    aspects.length === Math.min(count, maxTiles)
  ) {
    const row = (indices: ReadonlyArray<number>, height: string) => {
      const total = indices.reduce(
        (sum, index) => sum + (aspects[index] ?? 0),
        0,
      );
      return (
        <div
          key={indices.join("-")}
          className="flex gap-1"
          style={{
            width: `min(100%, calc(${total} * ${height} + ${indices.length - 1} * var(--spacing)))`,
          }}
        >
          {indices.map((index) => (
            <Fragment key={index}>
              {tile(index, "fit", index === 3 ? count - maxTiles : undefined, {
                flex: `${aspects[index]} 1 0%`,
                aspectRatio: `${aspects[index]}`,
              })}
            </Fragment>
          ))}
        </div>
      );
    };
    const rows =
      count === 2
        ? (aspects[0] ?? 0) + (aspects[1] ?? 0) > 4
          ? [[0], [1]]
          : [[0, 1]]
        : [
            [0, 1],
            [2, 3],
          ];
    const height =
      count === 2 ? "var(--media-box-h)" : "calc(var(--media-box-h) * 0.6)";
    return (
      <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
        {rows.map((indices) => row(indices, height))}
      </div>
    );
  }

  if (count === 2)
    return (
      <div className="flex w-full max-w-(--media-box-w) gap-1">
        {tile(0, "pair")}
        {tile(1, "pair")}
      </div>
    );

  if (count === 3)
    return (
      <div className="flex aspect-[2/1] w-full max-w-(--media-box-w) gap-1">
        {tile(0, "hero")}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {tile(1, "stack")}
          {tile(2, "stack")}
        </div>
      </div>
    );

  if (count < maxTiles) return null;

  return (
    <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
      <div className="flex gap-1">
        {tile(0, "grid")}
        {tile(1, "grid")}
      </div>
      <div className="flex gap-1">
        {tile(2, "grid")}
        {tile(3, "grid", count - maxTiles)}
      </div>
    </div>
  );
}
