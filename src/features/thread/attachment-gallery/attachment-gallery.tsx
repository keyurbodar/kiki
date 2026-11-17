import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
  audioCardClass,
  audioEntries,
  CompactMediaCard,
  cardDetailClass,
  cardTitleClass,
  cardTrailingIconClass,
  entryKey,
  FileTypeIcon,
  fileCardClass,
  fileEntries,
  fileKindLabel,
  formatBytes,
  formatDuration,
  type GalleryEntry,
  JustifiedMediaGrid,
  MediaGalleryMixed,
  type MediaItem,
  MediaSkeleton,
  MediaThumb,
  MediaTile,
  mediaItems,
  mediaLabel,
  mediaSize,
  SingleMediaTile,
} from "@/components/media-gallery";
import { MediaLightbox } from "@/components/media-lightbox";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";

const menuIconClass = "size-(--icon-sm) shrink-0 text-icon-muted";

const noop = () => {};

const downloadUrl = (url: string, name: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
};

const dedupe = (entries: ReadonlyArray<GalleryEntry>) => [
  ...new Map(entries.map((entry) => [entryKey(entry), entry])).values(),
];

export type FileCardProps = {
  entry: GalleryEntry;
  /** Opens the entry's preview instead of downloading it. */
  onOpen?: () => void;
};

/**
 * A non-media attachment: a document, sheet or archive chip with the file's
 * own glyph. Capy's `FileCard`.
 */
export function FileCard({ entry, onOpen }: FileCardProps) {
  const label = mediaLabel(entry);
  const detail =
    entry.unavailable === true
      ? "Download failed"
      : `${formatBytes(entry.file.sizeBytes)} · ${fileKindLabel(entry.file)}`;
  const body = (
    <>
      <MediaThumb>
        <FileTypeIcon name={entry.file.name} className="size-(--icon-base)" />
      </MediaThumb>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardTitleClass}>{label}</span>
        <span
          className={cx(
            "truncate text-2xs",
            entry.unavailable === true
              ? "text-destructive"
              : "text-muted-foreground-2",
          )}
        >
          {detail}
        </span>
      </span>
      <Icon name="arrow-inbox" className={cardTrailingIconClass} />
    </>
  );

  if (onOpen !== undefined)
    return (
      <button
        type="button"
        data-track-owner="features/thread/attachment-gallery#FileCard:button[onClick=onOpen]"
        aria-label={`Open ${label}`}
        onClick={onOpen}
        className={fileCardClass}
      >
        {body}
      </button>
    );

  if (entry.url !== undefined) {
    const url = entry.url;
    return (
      <a
        data-track-owner="features/thread/attachment-gallery#FileCard:a"
        href={url}
        download={entry.file.name}
        aria-label={`Download ${label}`}
        onClick={(event) => {
          event.preventDefault();
          downloadUrl(url, entry.file.name);
        }}
        className={fileCardClass}
      >
        {body}
      </a>
    );
  }

  return (
    <span className={cx(fileCardClass, "cursor-default hover:bg-button")}>
      {body}
    </span>
  );
}

function AudioTranscript({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex items-start gap-1 border-t-(length:--border-width-hairline) border-border-2 py-1.5 pr-1 pl-2.5">
      <p
        id={id}
        className={cx(
          "min-w-0 flex-1 py-0.5 text-xs text-muted-foreground",
          open
            ? "max-h-60 overflow-y-auto break-words whitespace-pre-wrap"
            : "truncate",
        )}
      >
        {text}
      </p>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-expanded={open}
        aria-controls={id}
        aria-label={
          open
            ? `Collapse transcript of ${label}`
            : `Expand transcript of ${label}`
        }
        onClick={() => setOpen(!open)}
      >
        <Icon
          name="chevron-down-small"
          className={open ? undefined : "-rotate-90"}
        />
      </Button>
    </div>
  );
}

/** A recorded clip with its seek bar, duration and transcript. */
export function AudioCard({ entry }: { entry: GalleryEntry }) {
  const label = mediaLabel(entry);
  const url = entry.unavailable === true ? undefined : entry.url;
  const element = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState<number>();
  const [mediaFailed, setMediaFailed] = useState(false);
  const unavailable = mediaFailed || entry.unavailable === true;
  const ready = url !== undefined && !unavailable;
  const progress =
    duration === undefined || duration === 0
      ? 0
      : Math.min(1, current / duration);

  const toggle = () => {
    const audio = element.current;
    if (audio === null) return;
    if (audio.paused) audio.play().catch(noop);
    else audio.pause();
  };

  const copyAddress = () => {
    if (url === undefined) return;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Audio address copied"),
      () => toast.error("Could not copy audio address"),
    );
  };

  return (
    <div
      className={audioCardClass}
      aria-busy={url === undefined && !unavailable}
    >
      {url === undefined ? null : (
        // biome-ignore lint/a11y/useMediaCaption: the card carries the clip's transcript
        <audio
          ref={element}
          src={url}
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onDurationChange={(event) =>
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : undefined,
            )
          }
          onError={() => {
            setMediaFailed(true);
            setPlaying(false);
          }}
        />
      )}
      <div className="flex h-12 items-center gap-2 py-1.5 pr-1 pl-1.5">
        <MediaThumb>
          <Icon name="audio" className="size-(--icon-base)" />
        </MediaThumb>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cardTitleClass}>{label}</span>
          <span
            className={cx(
              "truncate text-2xs",
              unavailable ? "text-destructive" : "text-muted-foreground-2",
            )}
          >
            {unavailable
              ? "Unavailable"
              : `${formatBytes(entry.file.sizeBytes)} · ${fileKindLabel(entry.file)}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            disabled={!ready}
            onClick={toggle}
          >
            <Icon name={playing ? "pause" : "play"} />
          </Button>
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${label} options`}
                />
              }
            >
              <Icon name="dot-grid-1x3-horizontal" />
            </MenuTrigger>
            <MenuContent align="end" className="w-48">
              <MenuItem disabled={!ready} onClick={copyAddress}>
                <Icon name="chain-link-1" className={menuIconClass} />
                Copy address
              </MenuItem>
              <MenuItem
                disabled={!ready}
                onClick={() => {
                  if (url !== undefined) downloadUrl(url, entry.file.name);
                }}
              >
                <Icon name="arrow-inbox" className={menuIconClass} />
                Download
              </MenuItem>
            </MenuContent>
          </Menu>
        </span>
      </div>
      <div className="flex items-center gap-2 border-t-(length:--border-width-hairline) border-border-2 py-2 pr-2 pl-1.5">
        <span className="group/seek relative flex h-4 min-w-0 flex-1 items-center rounded-full has-[:focus-visible]:outline-ring-inset">
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-border-3">
            <span
              className="block h-full rounded-full bg-foreground"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
          <span
            className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity duration-fast group-hover/seek:opacity-100 group-focus-within/seek:opacity-100"
            style={{ left: `${progress * 100}%` }}
          />
          <input
            type="range"
            aria-label={`Seek ${label}`}
            min={0}
            max={duration ?? 0}
            step={0.1}
            value={current}
            disabled={duration === undefined}
            onChange={(event) => {
              const audio = element.current;
              if (audio === null) return;
              audio.currentTime = Number(event.currentTarget.value);
              setCurrent(audio.currentTime);
            }}
            className="absolute inset-0 w-full cursor-pointer opacity-0 focus-visible:outline-none disabled:cursor-default"
          />
        </span>
        <span className="shrink-0 text-2xs tabular-nums text-muted-foreground-2">
          {formatDuration(current * 1000)} /{" "}
          {formatDuration((duration ?? 0) * 1000)}
        </span>
      </div>
      {entry.file.transcript === undefined ? null : (
        <AudioTranscript label={label} text={entry.file.transcript} />
      )}
    </div>
  );
}

/** An attachment still uploading: same chip, a spinner in the well. */
export function PendingCard({ entry }: { entry: GalleryEntry }) {
  const label = mediaLabel(entry);
  return (
    <span
      className={cx(fileCardClass, "cursor-default hover:bg-button")}
      aria-busy
    >
      <MediaThumb>
        <MediaSkeleton
          className="absolute inset-0"
          role="status"
          aria-label={`Sending ${label}`}
        />
      </MediaThumb>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardTitleClass}>{label}</span>
        <span className={cardDetailClass}>
          {formatBytes(entry.file.sizeBytes)} · {fileKindLabel(entry.file)}
        </span>
      </span>
    </span>
  );
}

function LightboxMedia({ item }: { item: MediaItem }) {
  if (item.entry.unavailable === true || item.entry.url === undefined)
    return null;
  if (item.kind === "video")
    return (
      <video
        src={item.entry.url}
        aria-label={item.label}
        controls
        autoPlay
        className="max-h-full max-w-full"
      >
        <track kind="captions" />
      </video>
    );
  return (
    <img
      src={item.entry.url}
      alt={item.label}
      draggable={false}
      className="max-h-full max-w-full object-contain"
    />
  );
}

export type AttachmentGalleryProps = ComponentProps<"div"> & {
  /** The message's files, in the order they were attached. */
  entries?: ReadonlyArray<GalleryEntry>;
  align?: "start" | "end";
  /** `compact` is the chip row; `full` is the tile grid. */
  variant?: "full" | "compact";
  /** Attachments that are still uploading. */
  pending?: boolean;
  /** Overrides the built-in lightbox. */
  onOpen?: (item: MediaItem, index: number) => void;
};

/**
 * The attachments under a message: the media gallery (paired, justified or
 * mixed), the audio players, the file chips, and the lightbox they open.
 */
export function AttachmentGallery({
  entries = [],
  align = "start",
  variant = "full",
  pending = false,
  onOpen,
  className,
  ...props
}: AttachmentGalleryProps) {
  const unique = dedupe(entries);
  const media = mediaItems(unique);
  const audio = audioEntries(unique);
  const files = fileEntries(unique);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (unique.length === 0) return null;

  const open =
    onOpen ??
    ((_item: MediaItem, index: number) => {
      setOpenIndex(index);
    });

  const lightbox =
    openIndex === null || media[openIndex] === undefined
      ? null
      : onOpen === undefined && (
          <MediaLightbox
            data-index={openIndex}
            className="fixed inset-0 z-(--z-overlay-content) flex items-center justify-center bg-overlay-media p-6 outline-none"
            tabIndex={-1}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setOpenIndex(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpenIndex(null);
              if (event.key === "ArrowRight")
                setOpenIndex(Math.min(openIndex + 1, media.length - 1));
              if (event.key === "ArrowLeft")
                setOpenIndex(Math.max(openIndex - 1, 0));
            }}
          >
            <LightboxMedia item={media[openIndex]} />
          </MediaLightbox>
        );

  if (variant === "compact")
    return (
      <div
        {...props}
        className={cx(
          "flex max-w-full flex-wrap gap-1.5",
          align === "end" && "justify-end",
          className,
        )}
      >
        {media.map((item, index) =>
          pending ? (
            <PendingCard key={item.key} entry={item.entry} />
          ) : (
            <CompactMediaCard
              key={item.key}
              item={item}
              onOpen={() => open(item, index)}
            />
          ),
        )}
        {audio.map((entry) =>
          pending ? (
            <PendingCard key={entryKey(entry)} entry={entry} />
          ) : (
            <AudioCard key={entryKey(entry)} entry={entry} />
          ),
        )}
        {files.map((entry) => (
          <FileCard key={entryKey(entry)} entry={entry} />
        ))}
        {lightbox}
      </div>
    );

  const gallery =
    media.length === 0 ? null : media.length === 1 ? (
      <SingleMediaTile item={media[0]} onOpen={() => open(media[0], 0)} />
    ) : media.some((item) => item.kind === "video") ? (
      <MediaGalleryMixed
        items={media}
        onOpen={(index) => open(media[index], index)}
      />
    ) : (
      <JustifiedMediaGrid
        count={media.length}
        sizes={media.map((item) => mediaSize(item.entry))}
        tile={(index, layout, more, style) => (
          <MediaTile
            key={media[index].key}
            item={media[index]}
            layout={layout}
            more={more}
            style={style}
            onOpen={() => open(media[index], index)}
          />
        )}
      />
    );

  return (
    <div
      {...props}
      className={cx(
        "flex max-w-full flex-col gap-2",
        align === "end" && "items-end",
        className,
      )}
    >
      {gallery}
      {audio.map((entry) => (
        <AudioCard key={entryKey(entry)} entry={entry} />
      ))}
      {files.length === 0 ? null : (
        <div
          className={cx(
            "flex flex-wrap gap-1.5",
            align === "end" && "justify-end",
          )}
        >
          {files.map((entry) => (
            <FileCard key={entryKey(entry)} entry={entry} />
          ))}
        </div>
      )}
      {lightbox}
    </div>
  );
}
