import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  ChevronDownSmallGlyph,
  DotsHorizontalGlyph,
  DownloadGlyph,
  isTallMedia,
  LinkGlyph,
  MEDIA_GRID_LIMIT,
  MediaGalleryMixed,
  MediaGrid,
  MediaPlayBadge,
  MediaSpinner,
  MediaTileFade,
  type MediaTileLayout,
  mediaCoverImage,
  mediaTileVariants,
  OpenExternalGlyph,
  ProgressRing,
  singleMediaStyle,
} from "@/components/media-gallery";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuTrigger } from "@/primitives/menu";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  type AttachmentEntry,
  type ComposerUpload,
  composerUploadStatus,
  fileMeta,
  formatBytes,
  formatClock,
  type GalleryItem,
  type KeyedAttachment,
  keyAttachments,
  mediaSizeOf,
  previewVariant,
  splitAttachments,
  uploadPercent,
} from "./attachment-format";
import { useAttachmentUrl } from "./attachment-source";

const track = (owner: string) =>
  `features/thread/attachment-gallery.tsx#${owner}`;

export const attachmentCard =
  "group flex h-12 w-60 max-w-full cursor-pointer items-center gap-2 rounded-(--radius-card) border-hairline border-border-2 bg-button py-1.5 pr-2 pl-1.5 text-left shadow-plate transition-colors duration-fast hover:bg-button-hover focus-visible:outline-ring-inset";

export const attachmentThumb =
  "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-(--radius) bg-secondary text-icon-muted";

const cardName =
  "mask-fade-r overflow-hidden text-sm font-medium whitespace-nowrap [--mask-fade-ramp:--spacing(2)]";

const cardHoverIcon =
  "size-(--icon-sm) shrink-0 text-icon-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100";

const audioCard =
  "flex w-80 max-w-full flex-col rounded-(--radius-card) border-hairline border-border-2 bg-button shadow-plate";

const tileButton = cx(
  mediaTileVariants(),
  "cursor-zoom-in focus-visible:outline-ring-inset",
);

export type MediaSkeletonProps = ComponentProps<"span">;

export function MediaSkeleton({ className, ...props }: MediaSkeletonProps) {
  return (
    <span
      className={cx(
        "shimmer-surface shimmer-surface-motion-safe inline-block rounded",
        className,
      )}
      {...props}
    />
  );
}

export type FileTypeIconProps = {
  name: string;
  size?: "sm" | "base" | "lg";
  className?: string;
};

export function FileTypeIcon({
  name,
  size = "base",
  className,
}: FileTypeIconProps) {
  return (
    <Icon
      name={name.endsWith("/") ? "folder-1" : "file-text"}
      size={size}
      className={cx("text-icon-muted", className)}
    />
  );
}

type LoadPhase = "loading" | "loaded" | "failed";

export function useLoadPhase(src: string) {
  const [state, setState] = useState<{ src: string; phase: LoadPhase }>({
    src,
    phase: "loading",
  });
  if (state.phase !== "loaded" && state.src !== src)
    setState({ src, phase: "loading" });
  const shown = state.phase === "loaded" ? state.src : src;
  return {
    src: shown,
    phase:
      state.src === src || state.phase === "loaded" ? state.phase : "loading",
    setPhase: (phase: LoadPhase) => setState({ src: shown, phase }),
  } as const;
}

const videoPoster = (src: string) =>
  src.startsWith("blob:") || src.startsWith("data:") || src.includes("#")
    ? src
    : `${src}#t=0.1`;

export function AttachmentFallback({ entry }: { entry: AttachmentEntry }) {
  return (
    <span className="flex size-full min-h-28 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground-2">
      <FileTypeIcon name={entry.file.name} size="lg" />
      <span className="max-w-full text-xs wrap-anywhere">
        {entry.title ?? entry.file.name}
      </span>
    </span>
  );
}

type MediaProps = { entry: AttachmentEntry; url: string; onFailed: () => void };

function TileImage({
  entry,
  url,
  onFailed,
  className,
}: MediaProps & { className: string }) {
  const { src, phase, setPhase } = useLoadPhase(url);
  if (phase === "failed") return <AttachmentFallback entry={entry} />;
  return (
    <>
      {phase === "loading" && <MediaSkeleton className="absolute inset-0" />}
      <img
        src={src}
        crossOrigin="anonymous"
        alt={entry.title ?? entry.file.name}
        className={cx(className, phase === "loading" && "opacity-0")}
        loading="lazy"
        onLoad={() => setPhase("loaded")}
        onError={() => {
          setPhase("failed");
          onFailed();
        }}
      />
    </>
  );
}

function TileVideo({
  entry,
  url,
  onFailed,
  badge = "md",
}: MediaProps & { badge?: "md" | "sm" }) {
  const { src, phase, setPhase } = useLoadPhase(url);
  if (phase === "failed") return <AttachmentFallback entry={entry} />;
  return (
    <>
      {phase === "loading" && <MediaSkeleton className="absolute inset-0" />}
      <video
        src={videoPoster(src)}
        crossOrigin="anonymous"
        aria-label={entry.title ?? entry.file.name}
        muted
        playsInline
        preload="metadata"
        className={cx(
          "size-full object-cover",
          phase === "loading" && "opacity-0",
        )}
        onLoadedData={() => setPhase("loaded")}
        onError={() => {
          setPhase("failed");
          onFailed();
        }}
      />
      {phase === "loaded" && <MediaPlayBadge size={badge} />}
    </>
  );
}

function MediaThumb({ item }: { item: GalleryItem }) {
  const resolved = useAttachmentUrl(
    item.entry.file,
    "gallery",
    previewVariant(item),
  );
  if (resolved.failed) return <AttachmentFallback entry={item.entry} />;
  if (resolved.url === undefined)
    return (
      <MediaSkeleton
        className="absolute inset-0"
        role="status"
        aria-label={`Loading ${item.label}`}
      />
    );
  return item.kind === "video" ? (
    <TileVideo
      entry={item.entry}
      url={resolved.url}
      onFailed={resolved.mediaFailed}
    />
  ) : (
    <TileImage
      entry={item.entry}
      url={resolved.url}
      onFailed={resolved.mediaFailed}
      className={mediaCoverImage}
    />
  );
}

export type MediaTileProps = {
  item: GalleryItem;
  layout: MediaTileLayout;
  more?: number;
  style?: CSSProperties;
  onOpen: () => void;
};

export function MediaTile({
  item,
  layout,
  more,
  style,
  onOpen,
}: MediaTileProps) {
  return (
    <button
      data-track-owner={track("MediaTile:button[onClick=onOpen]")}
      type="button"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      className={cx(
        mediaTileVariants({ layout }),
        "cursor-zoom-in focus-visible:outline-ring-inset",
        item.kind === "video" && "cursor-pointer",
      )}
      style={style}
    >
      <MediaThumb item={item} />
      {isTallMedia(mediaSizeOf(item)) && <MediaTileFade />}
      {more !== undefined && more > 0 && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-overlay text-lg font-medium text-overlay-fg">
          +{more}
        </span>
      )}
    </button>
  );
}

function SingleImage({
  entry,
  url,
  fill,
  onFailed,
}: MediaProps & { fill: boolean }) {
  const { src, phase, setPhase } = useLoadPhase(url);
  if (phase === "failed")
    return (
      <span className="block w-56 max-w-full">
        <AttachmentFallback entry={entry} />
      </span>
    );
  return (
    <>
      {phase === "loading" && (
        <MediaSkeleton
          className={fill ? "absolute inset-0" : "h-36 w-56 max-w-full"}
        />
      )}
      <img
        src={src}
        crossOrigin="anonymous"
        alt={entry.title ?? entry.file.name}
        className={cx(
          fill
            ? mediaCoverImage
            : "block max-h-(--media-box-h) w-auto max-w-full object-contain",
          phase === "loading" && (fill ? "opacity-0" : "hidden"),
        )}
        onLoad={() => setPhase("loaded")}
        onError={() => {
          setPhase("failed");
          onFailed();
        }}
      />
    </>
  );
}

export type VideoTileProps = {
  item: GalleryItem;
  onOpen: () => void;
  className?: string;
  videoClassName?: string;
};

export function VideoTile({
  item,
  onOpen,
  className = "w-full max-w-(--media-box-w)",
  videoClassName = "h-auto max-h-(--media-box-h) w-full object-contain",
}: VideoTileProps) {
  const resolved = useAttachmentUrl(item.entry.file, "gallery");
  const fallback = (
    <span className={cx(tileButton, "block w-56 max-w-full")}>
      <AttachmentFallback entry={item.entry} />
    </span>
  );
  if (resolved.failed) return fallback;
  if (resolved.url === undefined)
    return (
      <MediaSkeleton
        className="aspect-video w-full max-w-(--media-box-w) rounded-(--radius-card)"
        role="status"
        aria-label={`Loading ${item.label}`}
      />
    );
  return (
    <InlineVideo
      key={resolved.url}
      src={resolved.url}
      label={item.label}
      onExpand={onOpen}
      onFailed={resolved.mediaFailed}
      className={className}
      videoClassName={videoClassName}
      fallback={fallback}
    />
  );
}

function InlineVideo({
  src,
  label,
  onExpand,
  onFailed,
  className,
  videoClassName,
  fallback,
}: {
  src: string;
  label: string;
  onExpand: () => void;
  onFailed: () => void;
  className: string;
  videoClassName: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    <div
      data-slot="video-player"
      className={cx(
        "relative overflow-hidden rounded-(--radius-card) border-hairline border-border-2 bg-secondary",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: agent attachments carry no caption track */}
      <video
        src={src}
        crossOrigin="anonymous"
        aria-label={label}
        controls
        playsInline
        preload="metadata"
        className={videoClassName}
        onDoubleClick={onExpand}
        onError={() => {
          setFailed(true);
          onFailed();
        }}
      />
    </div>
  );
}

export function SingleMediaTile({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  const resolved = useAttachmentUrl(
    item.entry.file,
    "gallery",
    previewVariant(item),
  );
  if (item.kind === "video") return <VideoTile item={item} onOpen={onOpen} />;
  const size = resolved.failed ? undefined : mediaSizeOf(item);
  return (
    <button
      data-track-owner={track("SingleMediaTile:button[onClick=onOpen]")}
      type="button"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      className={cx(
        tileButton,
        size === undefined ? "block w-fit max-w-(--media-box-w)" : "block",
      )}
      style={size === undefined ? undefined : singleMediaStyle(size)}
    >
      {resolved.failed ? (
        <span className="block w-56 max-w-full">
          <AttachmentFallback entry={item.entry} />
        </span>
      ) : resolved.url === undefined ? (
        <MediaSkeleton
          className={
            size === undefined ? "h-36 w-56 max-w-full" : "absolute inset-0"
          }
          role="status"
          aria-label={`Loading ${item.label}`}
        />
      ) : (
        <SingleImage
          entry={item.entry}
          url={resolved.url}
          fill={size !== undefined}
          onFailed={resolved.mediaFailed}
        />
      )}
      {isTallMedia(size) && <MediaTileFade />}
    </button>
  );
}

export function saveUrl(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.rel = "noopener";
  link.click();
}

export function downloadUrl(url: string, name: string) {
  return fetch(url)
    .then((response) =>
      response.ok
        ? response.blob()
        : Promise.reject(new Error(response.statusText)),
    )
    .then((blob) => {
      const href = URL.createObjectURL(blob);
      saveUrl(href, name);
      window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
    });
}

type ResolvedDownload =
  | { failed: true }
  | { failed: false; href: string; objectUrl?: string; blob?: Blob };

function DownloadResolver({
  entry,
  onSettle,
}: {
  entry: AttachmentEntry;
  onSettle: (result: ResolvedDownload) => void;
}) {
  const resolved = useAttachmentUrl(entry.file, "gallery", "original");
  const settle = useEffectEvent(onSettle);
  const refresh = useEffectEvent(() => resolved.refresh());
  const retried = useRef(false);
  const name = entry.file.name;
  useEffect(() => {
    if (resolved.waiting) return;
    if (resolved.failed) {
      if (retried.current) return settle({ failed: true });
      retried.current = true;
      refresh();
      return;
    }
    const url = resolved.url;
    if (url === undefined) return;
    if (url.startsWith("data:")) {
      saveUrl(url, name);
      settle({ failed: false, href: url });
      return;
    }
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.blob()
          : Promise.reject(new Error(response.statusText)),
      )
      .then((blob) => {
        const href = URL.createObjectURL(blob);
        saveUrl(href, name);
        settle({ failed: false, href, objectUrl: href, blob });
      })
      .catch(() => {
        if (!controller.signal.aborted) settle({ failed: true });
      });
    return () => controller.abort();
  }, [name, resolved.failed, resolved.url, resolved.waiting]);
  return null;
}

type FileCardPhase =
  | { phase: "idle" }
  | { phase: "resolving" }
  | { phase: "failed" }
  | { phase: "ready"; href: string; objectUrl?: string; blob?: Blob };

export type FileCardProps = { entry: AttachmentEntry; onOpen?: () => void };

export function FileCard({ entry, onOpen }: FileCardProps) {
  const [state, setState] = useState<FileCardPhase>({ phase: "idle" });
  const anchor = useRef<HTMLAnchorElement>(null);
  const refocus = useRef(false);
  const objectUrl = state.phase === "ready" ? state.objectUrl : undefined;
  useEffect(() => {
    if (objectUrl !== undefined) return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);
  useEffect(() => {
    if (state.phase === "ready" && refocus.current) {
      refocus.current = false;
      anchor.current?.focus();
    }
  }, [state.phase]);
  const label = entry.title ?? entry.file.name;
  const resolving = state.phase === "resolving";
  const HoverGlyph = onOpen === undefined ? DownloadGlyph : OpenExternalGlyph;
  const body = (
    <>
      <span className={attachmentThumb}>
        <FileTypeIcon
          name={entry.file.name}
          className={cx(resolving && "opacity-40")}
        />
        {resolving && (
          <span className="absolute inset-0 flex items-center justify-center">
            <MediaSpinner size="xs" label={`Loading ${label}`} />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardName}>{label}</span>
        <span
          className={cx(
            "truncate text-2xs",
            state.phase === "failed"
              ? "text-destructive"
              : "text-muted-foreground-2",
          )}
        >
          {state.phase === "failed" ? "Download failed" : fileMeta(entry.file)}
        </span>
      </span>
      <HoverGlyph className={cardHoverIcon} />
      {resolving && (
        <DownloadResolver
          entry={entry}
          onSettle={(result) =>
            setState(
              result.failed
                ? { phase: "failed" }
                : {
                    phase: "ready",
                    href: result.href,
                    objectUrl: result.objectUrl,
                    blob: result.blob,
                  },
            )
          }
        />
      )}
    </>
  );
  if (onOpen !== undefined)
    return (
      <button
        data-track-owner={track("FileCard:button[onClick=onOpen]")}
        type="button"
        aria-label={`Open ${label}`}
        onClick={onOpen}
        className={attachmentCard}
      >
        {body}
      </button>
    );
  if (state.phase === "ready") {
    const { blob, href } = state;
    return (
      <a
        data-track-owner={track("FileCard:a.1")}
        ref={anchor}
        href={href}
        download={entry.file.name}
        aria-label={`Download ${label}`}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (blob === undefined) return;
          const fresh = URL.createObjectURL(blob);
          event.currentTarget.href = fresh;
          window.setTimeout(() => URL.revokeObjectURL(fresh), 60_000);
        }}
        className={attachmentCard}
      >
        {body}
      </a>
    );
  }
  return (
    <button
      data-track-owner={track("FileCard:button.1")}
      type="button"
      aria-label={`Download ${label}`}
      aria-busy={resolving}
      onClick={(event) => {
        refocus.current = document.activeElement === event.currentTarget;
        setState({ phase: "resolving" });
      }}
      className={attachmentCard}
    >
      {body}
    </button>
  );
}

export function copyAudioAddress(url: string) {
  return navigator.clipboard.writeText(url).then(
    () => toast.success("Audio address copied"),
    () => toast.error("Could not copy audio address"),
  );
}

export function AudioCard({ entry }: { entry: AttachmentEntry }) {
  const resolved = useAttachmentUrl(entry.file, "gallery");
  return resolved.url === undefined ? (
    <AudioPlayer
      entry={entry}
      url={undefined}
      unavailable={resolved.failed}
      onFailed={resolved.mediaFailed}
    />
  ) : (
    <AudioPlayer
      key={resolved.url}
      entry={entry}
      url={resolved.url}
      unavailable={false}
      onFailed={resolved.mediaFailed}
    />
  );
}

export type AudioPlayerProps = {
  entry: AttachmentEntry;
  url: string | undefined;
  unavailable: boolean;
  onFailed: () => void;
};

export function AudioPlayer({
  entry,
  url,
  unavailable,
  onFailed,
}: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number>();
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const label = entry.title ?? entry.file.name;
  const broken = errored || unavailable;
  const playable = url !== undefined && !broken && ready;
  const fraction =
    duration === undefined || duration === 0 ? 0 : Math.min(1, time / duration);
  const toggle = () => {
    const element = audio.current;
    if (element === null) return;
    if (element.paused) element.play().catch(() => {});
    else element.pause();
  };
  return (
    <div className={audioCard} aria-busy={url === undefined && !broken}>
      {url !== undefined && (
        // biome-ignore lint/a11y/useMediaCaption: the transcript row below is the caption
        <audio
          ref={audio}
          src={url}
          crossOrigin="anonymous"
          preload="metadata"
          onLoadedMetadata={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onDurationChange={(event) =>
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : undefined,
            )
          }
          onError={() => {
            setErrored(true);
            onFailed();
          }}
        />
      )}
      <div className="flex h-12 items-center gap-2 py-1.5 pr-1 pl-1.5">
        <span className={attachmentThumb}>
          <Icon name="voice-high" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cardName}>{label}</span>
          <span
            className={cx(
              "truncate text-2xs",
              broken ? "text-destructive" : "text-muted-foreground-2",
            )}
          >
            {broken ? "Unavailable" : fileMeta(entry.file)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          <Button
            data-track-owner={track("AudioPlayer:Button[onClick=toggle]")}
            variant="ghost"
            size="icon-sm"
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            disabled={!playable}
            onClick={toggle}
          >
            <Icon name={playing ? "pause" : "play"} />
          </Button>
          <Menu>
            <MenuTrigger
              data-track-owner={track("AudioPlayer:ResponsiveMenuTrigger.1")}
              render={
                <Button
                  data-track-owner={track("AudioPlayer:Button.1")}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${label} options`}
                />
              }
            >
              <DotsHorizontalGlyph className="size-(--icon-base)" />
            </MenuTrigger>
            <MenuContent align="end" className="w-48">
              <ResponsiveMenuItem
                data-track-owner={track(
                  "AudioPlayer:ResponsiveMenuItem[Copy address]",
                )}
                disabled={url === undefined}
                onClick={() => {
                  if (url !== undefined) void copyAudioAddress(url);
                }}
              >
                <span data-slot="menu-item-icon">
                  <LinkGlyph className="size-(--icon-base)" />
                </span>
                Copy address
              </ResponsiveMenuItem>
              <ResponsiveMenuItem
                data-track-owner={track(
                  "AudioPlayer:ResponsiveMenuItem[Download]",
                )}
                disabled={url === undefined}
                onClick={() => {
                  if (url !== undefined)
                    downloadUrl(url, entry.file.name).catch(() => {});
                }}
              >
                <span data-slot="menu-item-icon">
                  <DownloadGlyph className="size-(--icon-base)" />
                </span>
                Download
              </ResponsiveMenuItem>
            </MenuContent>
          </Menu>
        </span>
      </div>
      <div className="flex items-center gap-2 border-t-hairline border-border-2 py-2 pr-2 pl-1.5">
        <span className="group/seek relative flex h-4 min-w-0 flex-1 items-center rounded-full has-[:focus-visible]:outline-ring-inset">
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-border-3">
            <span
              className="block h-full rounded-full bg-foreground"
              style={{ width: `${fraction * 100}%` }}
            />
          </span>
          <span
            className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity duration-fast group-hover/seek:opacity-100 group-focus-within/seek:opacity-100"
            style={{ left: `${fraction * 100}%` }}
          />
          <input
            data-track-owner={track("AudioPlayer:input.1")}
            type="range"
            aria-label={`Seek ${label}`}
            min={0}
            max={duration ?? 0}
            step={0.1}
            value={time}
            disabled={duration === undefined}
            onChange={(event) => {
              const element = audio.current;
              if (element === null) return;
              element.currentTime = Number(event.currentTarget.value);
              setTime(element.currentTime);
            }}
            className="absolute inset-0 w-full cursor-pointer opacity-0 focus-visible:outline-none disabled:cursor-default"
          />
        </span>
        <span className="shrink-0 text-2xs tabular-nums text-muted-foreground-2">
          {formatClock(time * 1000)} / {formatClock((duration ?? 0) * 1000)}
        </span>
      </div>
      {entry.file.transcript !== undefined && (
        <AudioTranscript label={label} text={entry.file.transcript} />
      )}
    </div>
  );
}

export function AudioTranscript({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <div className="flex items-start gap-1 border-t-hairline border-border-2 py-1.5 pr-1 pl-2.5">
      <p
        id={id}
        className={cx(
          "min-w-0 flex-1 py-0.5 text-xs text-muted-foreground",
          expanded
            ? "max-h-60 overflow-y-auto break-words whitespace-pre-wrap"
            : "truncate",
        )}
      >
        {text}
      </p>
      <Button
        data-track-owner={track("AudioTranscript:Button.1")}
        variant="ghost"
        size="icon-xs"
        aria-expanded={expanded}
        aria-controls={id}
        aria-label={
          expanded
            ? `Collapse transcript of ${label}`
            : `Expand transcript of ${label}`
        }
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDownSmallGlyph
          className={cx("size-(--icon-base)", !expanded && "-rotate-90")}
        />
      </Button>
    </div>
  );
}

function CompactThumb({ item }: { item: GalleryItem }) {
  const resolved = useAttachmentUrl(
    item.entry.file,
    "gallery",
    previewVariant(item),
  );
  if (resolved.failed) return <FileTypeIcon name={item.entry.file.name} />;
  if (resolved.url === undefined)
    return (
      <MediaSkeleton
        className="absolute inset-0"
        role="status"
        aria-label={`Loading ${item.label}`}
      />
    );
  return item.kind === "video" ? (
    <CompactVideo
      entry={item.entry}
      url={resolved.url}
      onFailed={resolved.mediaFailed}
    />
  ) : (
    <CompactImage
      entry={item.entry}
      url={resolved.url}
      onFailed={resolved.mediaFailed}
    />
  );
}

function CompactImage({ entry, url, onFailed }: MediaProps) {
  const { src, phase, setPhase } = useLoadPhase(url);
  if (phase === "failed") return <FileTypeIcon name={entry.file.name} />;
  return (
    <>
      {phase === "loading" && <MediaSkeleton className="absolute inset-0" />}
      <img
        src={src}
        crossOrigin="anonymous"
        alt={entry.title ?? entry.file.name}
        className={cx(
          "size-full object-cover",
          phase === "loading" && "opacity-0",
        )}
        loading="lazy"
        onLoad={() => setPhase("loaded")}
        onError={() => {
          setPhase("failed");
          onFailed();
        }}
      />
    </>
  );
}

function CompactVideo({ entry, url, onFailed }: MediaProps) {
  const { phase } = useLoadPhase(url);
  if (phase === "failed") return <FileTypeIcon name={entry.file.name} />;
  return <TileVideo entry={entry} url={url} onFailed={onFailed} badge="sm" />;
}

export function CompactMediaCard({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  return (
    <button
      data-track-owner={track("CompactMediaCard:button[onClick=onOpen]")}
      type="button"
      aria-label={`Preview ${item.label}`}
      onClick={onOpen}
      className={attachmentCard}
    >
      <span className={attachmentThumb}>
        <CompactThumb item={item} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardName}>{item.label}</span>
        <span className="truncate text-2xs text-muted-foreground-2">
          {fileMeta(item.entry.file)}
        </span>
      </span>
      <OpenExternalGlyph className={cardHoverIcon} />
    </button>
  );
}

export function SendingCard({ entry }: { entry: AttachmentEntry }) {
  const label = entry.title ?? entry.file.name;
  return (
    <span className={attachmentCard} aria-busy>
      <span className={attachmentThumb}>
        <MediaSkeleton
          className="absolute inset-0"
          role="status"
          aria-label={`Sending ${label}`}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cardName}>{label}</span>
        <span className="truncate text-2xs text-muted-foreground-2">
          {fileMeta(entry.file)}
        </span>
      </span>
    </span>
  );
}

export type PendingUpload = { index: number; name: string; title?: string };
export type UploadProgress = { index: number; loaded: number; total: number };

export function UploadingCards({
  uploads,
  progress,
}: {
  uploads: ReadonlyArray<PendingUpload>;
  progress?: ReadonlyArray<UploadProgress>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {uploads.map((upload) => {
        const label = upload.title ?? upload.name;
        const current = progress?.find((entry) => entry.index === upload.index);
        const percent =
          current === undefined
            ? undefined
            : uploadPercent(current.loaded, current.total);
        return (
          <span key={upload.index} className={attachmentCard} aria-busy>
            <span className={attachmentThumb}>
              {percent === undefined || percent === 100 ? (
                <>
                  <FileTypeIcon name={upload.name} className="opacity-40" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <MediaSpinner size="xs" label={`Uploading ${label}`} />
                  </span>
                </>
              ) : (
                <ProgressRing value={percent} label={`Uploading ${label}`} />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cardName}>{label}</span>
              <span className="truncate text-2xs text-muted-foreground-2 tabular-nums">
                {current === undefined
                  ? "Uploading"
                  : `${formatBytes(current.total)} · ${percent === 100 ? "Finishing" : `${percent}%`}`}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ComposerUploadCards({
  uploads,
  align = "start",
}: {
  uploads: ReadonlyArray<ComposerUpload>;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cx(
        "flex max-w-full flex-wrap gap-1.5",
        align === "end" && "justify-end",
      )}
    >
      {uploads.map((upload) => (
        <span
          key={upload.localId}
          className={cx(attachmentCard, "cursor-default hover:bg-button")}
          aria-busy={upload.status === "uploading" || undefined}
        >
          <span className={attachmentThumb}>
            {upload.status === "uploading" ? (
              upload.progress === undefined || upload.progress === 100 ? (
                <MediaSpinner
                  size="base"
                  label={`${upload.progress === 100 ? "Finishing" : "Preparing"} upload: ${upload.name}`}
                />
              ) : (
                <ProgressRing
                  value={upload.progress}
                  label={`Uploading ${upload.name}`}
                />
              )
            ) : upload.previewUrl === undefined ? (
              <FileTypeIcon name={upload.name} />
            ) : (
              <img
                src={upload.previewUrl}
                crossOrigin="anonymous"
                alt={upload.name}
                className="size-full object-cover"
              />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={cardName}>{upload.name}</span>
            <span
              className={cx(
                "truncate text-2xs tabular-nums",
                upload.status === "failed"
                  ? "text-destructive"
                  : "text-muted-foreground-2",
              )}
            >
              {formatBytes(upload.sizeBytes)} · {composerUploadStatus(upload)}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

export type AttachmentGalleryProps = ComponentProps<"div"> & {
  entries?: ReadonlyArray<AttachmentEntry>;
  align?: "start" | "end";
  variant?: "full" | "compact";
  pending?: boolean;
  onOpenFile?: (
    entry: AttachmentEntry,
    all: ReadonlyArray<AttachmentEntry>,
  ) => void;
  onOpenMedia?: (items: ReadonlyArray<GalleryItem>, index: number) => void;
};

export function AttachmentGallery({
  entries = [],
  align = "start",
  variant = "full",
  pending = false,
  onOpenFile,
  onOpenMedia,
  className,
  ...props
}: AttachmentGalleryProps) {
  const [, setOpenIndex] = useState<number | null>(null);
  const keyed = keyAttachments(entries);
  if (keyed.length === 0) return null;
  const { media, audio, files } = splitAttachments(keyed);
  const open = (index: number) => {
    setOpenIndex(index);
    onOpenMedia?.(media, index);
  };
  const openFile = (entry: KeyedAttachment) =>
    entry.open ??
    (onOpenFile === undefined ? undefined : () => onOpenFile(entry, keyed));
  if (variant === "compact")
    return (
      <div
        data-slot="attachment-gallery"
        className={cx(
          "flex max-w-full flex-wrap gap-1.5",
          align === "end" && "justify-end",
          className,
        )}
        {...props}
      >
        {media.map((item, index) =>
          pending ? (
            <SendingCard key={item.key} entry={item.entry} />
          ) : (
            <CompactMediaCard
              key={item.key}
              item={item}
              onOpen={() => open(index)}
            />
          ),
        )}
        {audio.map((entry) =>
          pending ? (
            <SendingCard key={entry.key} entry={entry} />
          ) : (
            <AudioCard key={entry.key} entry={entry} />
          ),
        )}
        {files.map((entry) => (
          <FileCard key={entry.key} entry={entry} onOpen={openFile(entry)} />
        ))}
      </div>
    );
  return (
    <div
      data-slot="attachment-gallery"
      className={cx(
        "flex max-w-full flex-col gap-2",
        align === "end" && "items-end",
        className,
      )}
      {...props}
    >
      {media.length === 1 && media[0] !== undefined ? (
        <SingleMediaTile item={media[0]} onOpen={() => open(0)} />
      ) : media.some((item) => item.kind === "video") ? (
        <MediaGalleryMixed>
          {media
            .slice(0, MEDIA_GRID_LIMIT)
            .map((item, index) =>
              index === MEDIA_GRID_LIMIT - 1 &&
              media.length > MEDIA_GRID_LIMIT ? (
                <MediaTile
                  key={item.key}
                  item={item}
                  layout="grid"
                  more={media.length - MEDIA_GRID_LIMIT}
                  onOpen={() => open(index)}
                />
              ) : item.kind === "video" ? (
                <VideoTile
                  key={item.key}
                  item={item}
                  onOpen={() => open(index)}
                  className="w-full min-w-0"
                  videoClassName="aspect-video w-full object-contain"
                />
              ) : (
                <MediaTile
                  key={item.key}
                  item={item}
                  layout="grid"
                  onOpen={() => open(index)}
                />
              ),
            )}
        </MediaGalleryMixed>
      ) : (
        <MediaGrid
          count={media.length}
          sizes={media.map(mediaSizeOf)}
          tile={(index, layout, more, style) => {
            const item = media[index];
            return item === undefined ? null : (
              <MediaTile
                item={item}
                layout={layout}
                more={more}
                style={style}
                onOpen={() => open(index)}
              />
            );
          }}
        />
      )}
      {audio.map((entry) => (
        <AudioCard key={entry.key} entry={entry} />
      ))}
      {files.length > 0 && (
        <div
          className={cx(
            "flex flex-wrap gap-1.5",
            align === "end" && "justify-end",
          )}
        >
          {files.map((entry) => (
            <FileCard key={entry.key} entry={entry} onOpen={openFile(entry)} />
          ))}
        </div>
      )}
    </div>
  );
}
