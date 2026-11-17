import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Icon } from "@/primitives/icon";
import { imageUnavailableFrameClass } from "./classes";
import { MediaTile, VideoTile } from "./media-tile";
import type { MediaItem } from "./types";

const maxMixedTiles = 6;

export type MediaGalleryMixedProps = ComponentProps<"div"> & {
  /** The message's images and video, in order. */
  items?: ReadonlyArray<MediaItem>;
  onOpen?: (index: number) => void;
};

/**
 * The two-column gallery Capy uses once a message mixes video with images:
 * every tile keeps a 16:9 frame, the sixth one carries the +N count, and a
 * click opens the lightbox at that tile.
 */
export function MediaGalleryMixed({
  items = [],
  onOpen,
  className,
  ...props
}: MediaGalleryMixedProps) {
  return (
    <div
      {...props}
      data-slot="media-gallery-mixed"
      className={cx(
        "grid w-full max-w-(--media-box-w) grid-cols-2 gap-1",
        className,
      )}
    >
      {items
        .slice(0, maxMixedTiles)
        .map((item, index) =>
          index === maxMixedTiles - 1 && items.length > maxMixedTiles ? (
            <MediaTile
              key={item.key}
              item={item}
              layout="grid"
              more={items.length - maxMixedTiles}
              onOpen={onOpen === undefined ? undefined : () => onOpen(index)}
            />
          ) : item.kind === "video" ? (
            <VideoTile
              key={item.key}
              item={item}
              className="w-full min-w-0"
              videoClassName="aspect-video w-full object-contain"
              onOpen={onOpen === undefined ? undefined : () => onOpen(index)}
            />
          ) : (
            <MediaTile
              key={item.key}
              item={item}
              layout="grid"
              onOpen={onOpen === undefined ? undefined : () => onOpen(index)}
            />
          ),
        )}
    </div>
  );
}

export type ImageUnavailableProps = ComponentProps<"div"> & {
  /** The file name, read after the state in the accessible name. */
  label?: string;
};

/** The frame an image shows when Capy cannot render it. */
export function ImageUnavailable({
  label,
  className,
  ...props
}: ImageUnavailableProps) {
  const ariaLabel =
    label === undefined ? "Image unavailable" : `${label}, image unavailable`;
  return (
    <div
      {...props}
      role="img"
      data-slot="image-unavailable"
      aria-label={ariaLabel}
      className={cx(
        imageUnavailableFrameClass,
        "flex-col gap-1.5 border-(length:--border-width-hairline) border-border-2 bg-secondary p-4 text-center",
        className,
      )}
    >
      <Icon name="images-1" className="size-(--icon-base) text-icon-muted" />
      <span className="text-xs font-medium text-muted-foreground">
        Image unavailable
      </span>
      {label === undefined ? null : (
        <span className="line-clamp-2 text-2xs text-muted-foreground-2 wrap-anywhere">
          {label}
        </span>
      )}
    </div>
  );
}
