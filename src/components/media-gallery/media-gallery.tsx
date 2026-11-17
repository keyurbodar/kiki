import { cva, cx, type VariantProps } from "class-variance-authority";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Fragment } from "react";
import { Icon } from "@/primitives/icon";
import { ImagesGlyph } from "./glyphs";

export type MediaSize = { width: number; height: number };

export const MEDIA_TALL_RATIO = 3 / 4;
export const MEDIA_MAX_RATIO = 3;
export const MEDIA_GRID_LIMIT = 6;

export const mediaTileVariants = cva(
  "relative overflow-hidden rounded-(--radius-card) border-hairline border-border-2 bg-secondary",
  {
    variants: {
      layout: {
        pair: "aspect-[4/3] min-w-0 flex-1",
        hero: "min-w-0 flex-[1.5]",
        stack: "min-h-0 w-full flex-1",
        grid: "aspect-video min-w-0 flex-1",
        fit: "min-w-0",
      },
    },
  },
);

export type MediaTileLayout = NonNullable<
  VariantProps<typeof mediaTileVariants>["layout"]
>;

export const mediaCoverImage = "size-full object-cover object-top";

export const isTallMedia = (size: MediaSize | undefined) =>
  size !== undefined && size.width / size.height < MEDIA_TALL_RATIO;

export const mediaRatio = (size: MediaSize) =>
  Math.min(
    Math.max(size.width / size.height, MEDIA_TALL_RATIO),
    MEDIA_MAX_RATIO,
  );

export function singleMediaStyle(size: MediaSize): CSSProperties {
  const ratio = Math.max(size.width / size.height, MEDIA_TALL_RATIO);
  return {
    width: `min(100%, var(--media-box-w), ${size.width}px, calc(var(--media-box-h) * ${ratio}))`,
    aspectRatio: `${ratio}`,
  };
}

export function MediaTileFade() {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-secondary to-transparent" />
  );
}

export type MediaGridTile = (
  index: number,
  layout: MediaTileLayout,
  more?: number,
  style?: CSSProperties,
) => ReactNode;

export type MediaGridProps = {
  count: number;
  sizes?: ReadonlyArray<MediaSize | undefined>;
  tile: MediaGridTile;
};

export function mediaGridRows(
  count: number,
  ratios: ReadonlyArray<number>,
): number[][] {
  if (count === 2) {
    const [a = 0, b = 0] = ratios;
    return a + b > 4 ? [[0], [1]] : [[0, 1]];
  }
  return [
    [0, 1],
    [2, 3],
  ];
}

export function MediaGrid({ count, sizes, tile }: MediaGridProps) {
  const ratios = (sizes ?? [])
    .slice(0, Math.min(count, 4))
    .flatMap((size) => (size === undefined ? [] : [mediaRatio(size)]));
  if (count >= 2 && count !== 3 && ratios.length === Math.min(count, 4)) {
    const height =
      count === 2 ? "var(--media-box-h)" : "calc(var(--media-box-h) * 0.6)";
    return (
      <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
        {mediaGridRows(count, ratios).map((row) => {
          const total = row.reduce(
            (sum, index) => sum + (ratios[index] ?? 0),
            0,
          );
          return (
            <div
              key={row[0]}
              className="flex gap-1"
              style={{
                width: `min(100%, calc(${total} * ${height} + ${row.length - 1} * var(--spacing)))`,
              }}
            >
              {row.map((index) => (
                <Fragment key={index}>
                  {tile(index, "fit", index === 3 ? count - 4 : undefined, {
                    flex: `${ratios[index]} 1 0%`,
                    aspectRatio: `${ratios[index]}`,
                  })}
                </Fragment>
              ))}
            </div>
          );
        })}
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
  if (count < 4) return null;
  return (
    <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
      <div className="flex gap-1">
        {tile(0, "grid")}
        {tile(1, "grid")}
      </div>
      <div className="flex gap-1">
        {tile(2, "grid")}
        {tile(3, "grid", count - 4)}
      </div>
    </div>
  );
}

export type MediaGalleryMixedProps = ComponentProps<"div">;

export function MediaGalleryMixed({
  className,
  ...props
}: MediaGalleryMixedProps) {
  return (
    <div
      data-slot="media-gallery-mixed"
      className={cx(
        "grid w-full max-w-(--media-box-w) grid-cols-2 gap-1",
        className,
      )}
      {...props}
    />
  );
}

export const imageUnavailableBox =
  "flex aspect-video w-(--media-box-w) max-w-full items-center justify-center rounded-(--radius-card)";

export type ImageUnavailableProps = ComponentProps<"div"> & { label?: string };

export function ImageUnavailable({
  label,
  className,
  ...props
}: ImageUnavailableProps) {
  return (
    <div
      role="img"
      data-slot="image-unavailable"
      aria-label={
        label === undefined
          ? "Image unavailable"
          : `${label}, image unavailable`
      }
      className={cx(
        imageUnavailableBox,
        "flex-col gap-1.5 border-hairline border-border-2 bg-secondary p-4 text-center",
        className,
      )}
      {...props}
    >
      <ImagesGlyph className="size-(--icon-base) text-icon-muted" />
      <span className="text-xs font-medium text-muted-foreground">
        Image unavailable
      </span>
      {label !== undefined && (
        <span className="line-clamp-2 text-2xs text-muted-foreground-2 wrap-anywhere">
          {label}
        </span>
      )}
    </div>
  );
}

export function MediaSkeletonRow({ width }: { width: string }) {
  return (
    <div className="flex h-[calc(var(--spacing)*3.9)] items-center gap-3">
      <span className="shimmer-surface shimmer-surface-motion-safe h-2.5 w-4 shrink-0 rounded" />
      <span
        className={cx(
          "shimmer-surface shimmer-surface-motion-safe h-2.5 rounded",
          width,
        )}
      />
    </div>
  );
}

export type MediaPlayBadgeProps = { size?: "md" | "sm" };

export function MediaPlayBadge({ size = "md" }: MediaPlayBadgeProps) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={cx(
          "flex items-center justify-center rounded-full bg-overlay text-overlay-fg",
          size === "md" ? "size-11" : "size-4",
        )}
      >
        <Icon
          name="play"
          className={size === "md" ? "size-(--icon-lg)" : "size-2"}
        />
      </span>
    </span>
  );
}

export type ProgressRingProps = {
  value: number;
  label: string;
  className?: string;
};

export function ProgressRing({ value, label, className }: ProgressRingProps) {
  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      viewBox="0 0 24 24"
      className={cx("size-5 text-muted-foreground-1", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="var(--border-3)"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${value} 100`}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

export type MediaSpinnerProps = {
  label?: string;
  size?: "xs" | "sm" | "base";
  role?: "status" | "img";
  className?: string;
};

export function MediaSpinner({
  label = "Loading",
  size = "sm",
  role = "status",
  className,
}: MediaSpinnerProps) {
  const classes = cx(
    "inline-block animate-spin rounded-full border-2 border-border-3 border-t-current text-muted-foreground-1",
    size === "xs" ? "size-3" : size === "sm" ? "size-4" : "size-(--icon-base)",
    className,
  );
  return role === "img" ? (
    <span role="img" aria-label={label} className={classes} />
  ) : (
    <span role="status" aria-label={label} className={classes} />
  );
}
