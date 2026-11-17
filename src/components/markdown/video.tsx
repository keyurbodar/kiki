import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { VideoPlayer } from "@/components/video-player";
import { useMarkdownMedia } from "./gallery";

export type MarkdownVideoProps = Omit<ComponentProps<"span">, "title"> & {
  /** Video URL; without it the slot renders its children. */
  src?: string;
  /** Alt text of the source markdown, used as the player label. */
  title?: string;
  /** Expand into the lightbox; defaults to the media provider's onOpen. */
  onExpand?: () => void;
};

/** Capy's markdown-video: an inline player with an unavailable fallback. */
export function MarkdownVideo({
  src,
  title,
  onExpand,
  className,
  children,
  ...props
}: MarkdownVideoProps) {
  const { onOpen } = useMarkdownMedia();
  if (src === undefined)
    return (
      <span data-slot="markdown-video" className={className} {...props}>
        {children}
      </span>
    );
  const label = title !== undefined && title.length > 0 ? title : "Video";
  const expand =
    onExpand ??
    (onOpen === undefined
      ? undefined
      : () => onOpen([{ kind: "video", src, label }], 0));
  return (
    <span
      data-slot="markdown-video"
      data-video-src={src}
      className={cx("block w-full max-w-(--media-box-w)", className)}
      {...props}
    >
      <VideoPlayer
        key={src}
        src={src}
        label={label}
        register="inline"
        onExpand={expand}
        crossOrigin="none"
        videoClassName="h-auto max-h-(--media-box-h) w-full object-contain"
        fallback={
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-24 items-center justify-center rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-secondary text-xs text-muted-foreground-2"
          >
            Video unavailable, open in a new tab
          </a>
        }
      />
    </span>
  );
}
