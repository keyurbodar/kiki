import { cx } from "class-variance-authority";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Icon } from "@/primitives/icon";
import {
  cardDetailClass,
  cardTitleClass,
  cardTrailingIconClass,
  fileCardClass,
  type MediaLayout,
  mediaCoverClass,
  mediaLayoutClass,
  mediaZoomClass,
  thumbClass,
} from "./classes";
import { FileTypeIcon } from "./file-type-icon";
import { fileKindLabel, formatBytes } from "./format";
import {
  type GalleryEntry,
  type MediaItem,
  mediaLabel,
  mediaSize,
} from "./types";

const MIN_ASPECT = 3 / 4;

/** Video posters are decoded a frame in so the tile never flashes black. */
const posterFrame = (url: string) => `${url}#t=0.001`;

export const isTallMedia = (entry: GalleryEntry) => {
  const size = mediaSize(entry);
  return size !== undefined && size.width / size.height < MIN_ASPECT;
};

/** The frame width Capy computes for a single sized image. */
export const mediaFrameStyle = (size: {
  width: number;
  height: number;
}): CSSProperties => {
  const aspect = Math.max(size.width / size.height, MIN_ASPECT);
  return {
    width: `min(100%, var(--media-box-w), ${size.width}px, calc(var(--media-box-h) * ${aspect}))`,
    aspectRatio: `${aspect}`,
  };
};

/** The tall-image scrim that keeps a caption legible over a crop. */
export function MediaGradient() {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-secondary to-transparent" />
  );
}

export function MediaSkeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("shimmer-surface rounded", className)}
      {...props}
      aria-hidden={props["aria-label"] === undefined ? true : undefined}
    />
  );
}

export type PlayBadgeProps = { size?: "md" | "sm" };

export function PlayBadge({ size = "md" }: PlayBadgeProps) {
  return (
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
  );
}

/** The state a tile shows when its file will not render. */
export function MissingMedia({ entry }: { entry: GalleryEntry }) {
  return (
    <span className="flex size-full min-h-28 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground-2">
      <FileTypeIcon name={entry.file.name} className="size-(--icon-lg)" />
      <span className="max-w-full text-xs wrap-anywhere">
        {mediaLabel(entry)}
      </span>
    </span>
  );
}

type Phase = "loading" | "loaded" | "failed";

function useMediaPhase() {
  const [phase, setPhase] = useState<Phase>("loading");
  return {
    phase,
    loaded: () => setPhase("loaded"),
    failed: () => setPhase("failed"),
  };
}

function CoverImage({ entry, url }: { entry: GalleryEntry; url: string }) {
  const { phase, loaded, failed } = useMediaPhase();
  if (phase === "failed") return <MissingMedia entry={entry} />;
  return (
    <>
      {phase === "loading" ? (
        <MediaSkeleton className="absolute inset-0" />
      ) : null}
      <img
        src={url}
        crossOrigin="anonymous"
        alt={mediaLabel(entry)}
        className={cx(mediaCoverClass, phase === "loading" && "opacity-0")}
        loading="lazy"
        onLoad={loaded}
        onError={failed}
      />
    </>
  );
}

function CoverVideo({
  entry,
  url,
  badge,
}: {
  entry: GalleryEntry;
  url: string;
  badge?: boolean;
}) {
  const { phase, loaded, failed } = useMediaPhase();
  if (phase === "failed") return <MissingMedia entry={entry} />;
  return (
    <>
      {phase === "loading" ? (
        <MediaSkeleton className="absolute inset-0" />
      ) : null}
      <video
        src={posterFrame(url)}
        crossOrigin="anonymous"
        aria-label={mediaLabel(entry)}
        muted
        playsInline
        preload="metadata"
        className={cx(
          "size-full object-cover",
          phase === "loading" && "opacity-0",
        )}
        onLoadedData={loaded}
        onError={failed}
      />
      {badge === true && phase === "loaded" ? <PlayBadge /> : null}
    </>
  );
}

/** The tile's first layer: cover image, poster frame, skeleton or failure. */
function TileMedia({ item }: { item: MediaItem }) {
  const { entry } = item;
  if (entry.unavailable === true) return <MissingMedia entry={entry} />;
  if (entry.url === undefined)
    return (
      <MediaSkeleton
        className="absolute inset-0"
        role="status"
        aria-label={`Loading ${item.label}`}
      />
    );
  return item.kind === "video" ? (
    <CoverVideo key={entry.url} entry={entry} url={entry.url} badge />
  ) : (
    <CoverImage key={entry.url} entry={entry} url={entry.url} />
  );
}

/** The thumbnail well a file, audio or compact card leads with. */
export function MediaThumb({ children }: { children: ReactNode }) {
  return <span className={thumbClass}>{children}</span>;
}

/** The thumbnail well filled with an entry's own frame. */
export function MediaThumbnail({ item }: { item: MediaItem }) {
  return (
    <MediaThumb>
      <TileMedia item={item} />
    </MediaThumb>
  );
}

export type MediaTileProps = {
  item: MediaItem;
  layout: MediaLayout;
  /** Remaining entries when this tile is the last one in the grid. */
  more?: number;
  style?: CSSProperties;
  onOpen?: () => void;
};

/** One tile of a laid-out gallery. Capy's `MediaTile`. */
export function MediaTile({
  item,
  layout,
  more,
  style,
  onOpen,
}: MediaTileProps) {
  return (
    <button
      type="button"
      data-track-owner="features/thread/attachment-gallery#MediaTile:button[onClick=onOpen]"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      style={style}
      className={cx(
        mediaZoomClass,
        mediaLayoutClass[layout],
        item.kind === "video" && "cursor-pointer",
      )}
    >
      <TileMedia item={item} />
      {isTallMedia(item.entry) ? <MediaGradient /> : null}
      {more !== undefined && more > 0 ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-overlay text-lg font-medium text-overlay-fg">
          +{more}
        </span>
      ) : null}
    </button>
  );
}

function SingleImage({
  entry,
  url,
  fill,
}: {
  entry: GalleryEntry;
  url: string;
  fill: boolean;
}) {
  const { phase, loaded, failed } = useMediaPhase();
  if (phase === "failed")
    return (
      <span className="block w-56 max-w-full">
        <MissingMedia entry={entry} />
      </span>
    );
  return (
    <>
      {phase === "loading" ? (
        <MediaSkeleton
          className={fill ? "absolute inset-0" : "h-36 w-56 max-w-full"}
        />
      ) : null}
      <img
        src={url}
        crossOrigin="anonymous"
        alt={mediaLabel(entry)}
        className={cx(
          fill
            ? mediaCoverClass
            : "block max-h-(--media-box-h) w-auto max-w-full object-contain",
          phase === "loading" && (fill ? "opacity-0" : "hidden"),
        )}
        onLoad={loaded}
        onError={failed}
      />
    </>
  );
}

export type SingleMediaTileProps = {
  item: MediaItem;
  onOpen?: () => void;
};

/** The one-media gallery: the image at its own aspect, or a video frame. */
export function SingleMediaTile({ item, onOpen }: SingleMediaTileProps) {
  if (item.kind === "video") return <VideoTile item={item} onOpen={onOpen} />;
  const { entry } = item;
  const size = entry.unavailable === true ? undefined : mediaSize(entry);
  const fill = size !== undefined;
  return (
    <button
      type="button"
      data-track-owner="features/thread/attachment-gallery#SingleMediaTile:button[onClick=onOpen]"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      style={fill ? mediaFrameStyle(size) : undefined}
      className={cx(
        mediaZoomClass,
        fill ? "block" : "block w-fit max-w-(--media-box-w)",
      )}
    >
      {entry.unavailable === true ? (
        <span className="block w-56 max-w-full">
          <MissingMedia entry={entry} />
        </span>
      ) : entry.url === undefined ? (
        <MediaSkeleton
          className={fill ? "absolute inset-0" : "h-36 w-56 max-w-full"}
          role="status"
          aria-label={`Loading ${item.label}`}
        />
      ) : (
        <SingleImage
          key={entry.url}
          entry={entry}
          url={entry.url}
          fill={fill}
        />
      )}
      {isTallMedia(entry) ? <MediaGradient /> : null}
    </button>
  );
}

export type VideoTileProps = {
  item: MediaItem;
  onOpen?: () => void;
  className?: string;
  videoClassName?: string;
};

/**
 * A video inside a message. Capy renders its own player here (shared/video-
 * player, T19); until that lands this shows the poster frame with Capy's play
 * badge and opens the lightbox on click, the same contract as Capy's
 * `register: "inline"` player.
 */
export function VideoTile({
  item,
  onOpen,
  className = "w-full max-w-(--media-box-w)",
  videoClassName = "h-auto max-h-(--media-box-h) w-full object-contain",
}: VideoTileProps) {
  const { entry } = item;
  if (entry.unavailable === true)
    return (
      <span className="block w-56 max-w-full">
        <MissingMedia entry={entry} />
      </span>
    );
  if (entry.url === undefined)
    return (
      <MediaSkeleton
        className="aspect-video w-full max-w-(--media-box-w) rounded-(--radius-card)"
        role="status"
        aria-label={`Loading ${item.label}`}
      />
    );
  return (
    <VideoFrame
      key={entry.url}
      item={item}
      url={entry.url}
      className={className}
      videoClassName={videoClassName}
      onOpen={onOpen}
    />
  );
}

function VideoFrame({
  item,
  url,
  className,
  videoClassName,
  onOpen,
}: {
  item: MediaItem;
  url: string;
  className: string;
  videoClassName: string;
  onOpen?: () => void;
}) {
  const { phase, loaded, failed } = useMediaPhase();
  if (phase === "failed")
    return (
      <span className="block w-56 max-w-full">
        <MissingMedia entry={item.entry} />
      </span>
    );
  return (
    <button
      type="button"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      className={cx(mediaZoomClass, "block", className)}
    >
      <video
        src={posterFrame(url)}
        crossOrigin="anonymous"
        aria-label={item.label}
        muted
        playsInline
        preload="metadata"
        className={videoClassName}
        onLoadedData={loaded}
        onError={failed}
      />
      {phase === "loaded" ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <PlayBadge />
        </span>
      ) : null}
    </button>
  );
}

export type CompactMediaCardProps = {
  item: MediaItem;
  onOpen?: () => void;
};

/** The media chip row the compact gallery uses. Capy's `CompactMediaCard`. */
export function CompactMediaCard({ item, onOpen }: CompactMediaCardProps) {
  return (
    <button
      type="button"
      data-track-owner="features/thread/attachment-gallery#CompactMediaCard:button[onClick=onOpen]"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      className={fileCardClass}
    >
      <MediaThumbnail item={item} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardTitleClass}>{item.label}</span>
        <span className={cardDetailClass}>
          {formatBytes(item.entry.file.sizeBytes)} ·{" "}
          {fileKindLabel(item.entry.file)}
        </span>
      </span>
      <Icon name="square-arrow-top-right" className={cardTrailingIconClass} />
    </button>
  );
}
