import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type UIEvent,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import {
  PAN_ZOOM_MAX,
  PAN_ZOOM_MIN,
  PanZoomControls,
  usePanZoom,
} from "@/components/pan-zoom";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type MediaKind,
  type MediaSource,
  mediaActions,
  mediaShortcutLabel,
  useMediaShortcut,
} from "./media-actions";

export type MediaLightboxEntry = {
  key: string;
  /** Accessible name of the item, shown in the strip as "Show {label}". */
  label: string;
  kind: MediaKind;
};

export type MediaLightboxProps<
  T extends MediaLightboxEntry = MediaLightboxEntry,
> = {
  entries: readonly T[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** The full-size media for an entry (an img for images). */
  renderMedia: (entry: T) => ReactNode;
  /** The strip thumbnail for an entry. */
  renderThumbnail: (entry: T) => ReactNode;
  /** Buttons before the close button in the top-right toolbar. */
  renderActions?: (entry: T) => ReactNode;
  /** Annotation hook: a layer rendered over the whole lightbox. */
  overlay?: ReactNode;
  /** Annotation hook: a side panel (Capy's media comments panel). */
  aside?: ReactNode;
  /** Runs on Escape first; return true to keep the lightbox open. */
  onEscape?: () => boolean | undefined;
};

const DRAG_THRESHOLD = 3;

type Press = { on: "media" | "backdrop" | null; x: number; y: number };
const NO_PRESS: Press = { on: null, x: 0, y: 0 };

const wrap = (index: number, length: number) => (index + length) % length;

/**
 * Capy's shared/media-lightbox: a full-screen dialog over the media scrim with
 * a counter, the lightbox-actions toolbar, previous/next buttons, the
 * thumbnail strip and, for images, pan-zoom with its controls.
 */
export function MediaLightbox<T extends MediaLightboxEntry>({
  entries,
  index,
  onIndexChange,
  onClose,
  renderMedia,
  renderThumbnail,
  renderActions,
  overlay,
  aside,
  onEscape,
}: MediaLightboxProps<T>) {
  const entry = entries[index];
  const image = entry?.kind === "image";
  const view = usePanZoom(
    PAN_ZOOM_MAX,
    PAN_ZOOM_MIN,
    image
      ? {
          key: entry.key,
          onTap: (x, y, double) => {
            if (press.current.on === "backdrop") onClose();
            else if (press.current.on === "media" && double)
              view.toggleZoom(x, y);
          },
          onSwipe: (direction) =>
            onIndexChange(wrap(index + direction, entries.length)),
        }
      : undefined,
  );
  const popup = useRef<HTMLDivElement>(null);
  const press = useRef<Press>(NO_PRESS);
  const menuOpenOnPress = useRef(false);

  useEffect(() => {
    const onPointerDown = () => {
      menuOpenOnPress.current =
        popup.current?.querySelector(
          '[aria-haspopup="menu"][data-popup-open]',
        ) != null;
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const transformed =
    image && (view.zoom > 1 || view.pan.x !== 0 || view.pan.y !== 0);
  const { setZoom, setPan } = view;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the view whenever the shown item changes
  useLayoutEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [entry?.key]);

  if (entry === undefined) return null;
  const many = entries.length > 1;

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      (event.target instanceof Element &&
        event.target.closest('[role="dialog"]') !== event.currentTarget) ||
      document.querySelector('[role="menu"][data-open]') !== null
    )
      return;
    const editing =
      event.target instanceof Element &&
      event.target.closest(
        "input, textarea, [contenteditable='true'], [contenteditable='plaintext-only']",
      ) !== null;
    if (image && !editing) view.onKeyDown(event);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (onEscape?.() === true) return;
      onClose();
      return;
    }
    if (!many || editing) return;
    if (
      !event.shiftKey &&
      event.target instanceof Element &&
      event.target.closest('[data-slot="video-player"], video') !== null
    )
      return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onIndexChange(wrap(index - 1, entries.length));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onIndexChange(wrap(index + 1, entries.length));
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.target as Node)) return;
    press.current = {
      on:
        event.button !== 0 || menuOpenOnPress.current
          ? null
          : event.target instanceof Element &&
              event.target.closest("[data-lightbox-media]") !== null
            ? "media"
            : "backdrop",
      x: event.clientX,
      y: event.clientY,
    };
    if (event.button !== 0) return;
    if (transformed || (image && event.pointerType === "touch"))
      view.onPointerDown(event);
    else if (press.current.on === "backdrop")
      event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (
      start.on !== null &&
      (Math.abs(event.clientX - start.x) > DRAG_THRESHOLD ||
        Math.abs(event.clientY - start.y) > DRAG_THRESHOLD)
    )
      view.setDragged(true);
    if (transformed || (image && event.pointerType === "touch"))
      view.onPointerMove(event);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (image && event.pointerType === "touch") {
      view.onPointerUp(event);
      press.current = NO_PRESS;
      view.setDragged(false);
      return;
    }
    const start = press.current;
    const clicked = start.on !== null && !view.dragged();
    view.onPointerUp(event);
    press.current = NO_PRESS;
    view.setDragged(false);
    if (!clicked) return;
    if (start.on === "backdrop") onClose();
    else if (image) view.toggleZoom(start.x, start.y);
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    view.onPointerUp(event);
    press.current = NO_PRESS;
    view.setDragged(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay scrim="media" forceRender />
        <DialogPopup
          ref={(node) => {
            popup.current = node;
            (
              node?.querySelector<HTMLElement>("[data-lightbox-media] video") ??
              node
            )?.focus();
          }}
          data-media-preview=""
          tabIndex={-1}
          initialFocus={popup}
          aria-label={entry.label}
          className={cx(
            "fixed inset-0 z-(--z-dialog) h-dvh overflow-hidden outline-none transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast",
            many && "sm:[--lightbox-strip:3rem]",
            many &&
              (image
                ? "pointer-fine:[--lightbox-gutter:3.5rem]"
                : "[--lightbox-gutter:3.5rem]"),
          )}
          onKeyDownCapture={onKeyDownCapture}
        >
          <div
            ref={image ? view.setStage : undefined}
            className="absolute inset-0 overflow-hidden"
            style={{
              touchAction: image ? "none" : undefined,
              cursor: transformed
                ? view.panning
                  ? "grabbing"
                  : "grab"
                : "default",
            }}
            onContextMenuCapture={(event) => {
              if (
                image &&
                (view.panning ||
                  ("pointerType" in event.nativeEvent &&
                    event.nativeEvent.pointerType === "touch"))
              ) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={(event) => {
              if (image && event.pointerType === "touch")
                view.onPointerUp(event);
            }}
          >
            <div className="flex h-full w-full items-center justify-center p-6 px-[var(--lightbox-gutter,1.5rem)] pb-[calc(1.5rem+var(--lightbox-strip,0rem))]">
              <div
                className="flex origin-[50%_calc(50%+var(--lightbox-strip,0rem)/2)] backface-hidden motion-reduce:transition-none!"
                style={
                  image
                    ? {
                        transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})`,
                        willChange: view.panning ? "transform" : undefined,
                      }
                    : undefined
                }
              >
                <div
                  key={entry.key}
                  data-lightbox-media
                  className={cx(
                    "contents",
                    image &&
                      "[&_img]:select-none [&_img]:[-webkit-touch-callout:none]",
                    image && view.zoom <= 1 && "*:cursor-zoom-in",
                  )}
                >
                  {renderMedia(entry)}
                </div>
              </div>
            </div>
            {image ? <PanZoomControls view={view} /> : null}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(max-content,1fr)] items-center gap-2 pr-[calc(1rem+var(--lightbox-controls,0rem))] pl-4">
            <span />
            {many ? (
              <span className="text-sm tabular-nums text-overlay-fg">
                {index + 1} / {entries.length}
              </span>
            ) : (
              <span />
            )}
            <LightboxActions>
              {renderActions?.(entry)}
              <Button
                size="icon-sm"
                aria-label="Close preview"
                onClick={onClose}
              >
                <Icon name="cross-large" />
              </Button>
            </LightboxActions>
          </div>
          {aside}
          {overlay}
          {many ? (
            <>
              <Button
                size="icon-sm"
                aria-label="Previous item"
                className={cx(
                  "absolute top-1/2 left-4 -translate-y-1/2",
                  image && "pointer-coarse:hidden",
                )}
                onClick={() => onIndexChange(wrap(index - 1, entries.length))}
              >
                <Icon name="arrow-left" />
              </Button>
              <Button
                size="icon-sm"
                aria-label="Next item"
                className={cx(
                  "absolute top-1/2 right-4 -translate-y-1/2",
                  image && "pointer-coarse:hidden",
                )}
                onClick={() => onIndexChange(wrap(index + 1, entries.length))}
              >
                <Icon name="arrow-right" />
              </Button>
              <LightboxStrip
                entries={entries}
                index={index}
                onIndexChange={onIndexChange}
                renderThumbnail={renderThumbnail}
              />
            </>
          ) : null}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

export type LightboxActionsProps = ComponentProps<"div">;

/** The top-right toolbar: entry actions, then the close button. */
export function LightboxActions({ className, ...props }: LightboxActionsProps) {
  return (
    <div
      data-slot="lightbox-actions"
      className={cx(
        "flex items-center justify-end gap-2 *:pointer-events-auto",
        className,
      )}
      {...props}
    />
  );
}

/** Thumbnail size and stride (size-12 plus the gap), as in Capy's strip. */
export const STRIP_THUMB = 48;
export const STRIP_STRIDE = 54;
const STRIP_OVERSCAN = 4;

export type LightboxStripProps<
  T extends MediaLightboxEntry = MediaLightboxEntry,
> = {
  entries: readonly T[];
  index: number;
  onIndexChange: (index: number) => void;
  renderThumbnail: (entry: T) => ReactNode;
};

/** The visible window of strip thumbnails for a scroll position. */
export function stripWindow(
  scrollLeft: number,
  clientWidth: number,
  count: number,
) {
  return {
    start: Math.max(0, Math.floor(scrollLeft / STRIP_STRIDE) - STRIP_OVERSCAN),
    end: Math.min(
      count,
      Math.ceil((scrollLeft + clientWidth) / STRIP_STRIDE) + STRIP_OVERSCAN,
    ),
  };
}

const scrollStripHorizontally = (event: WheelEvent<HTMLDivElement>) => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.currentTarget.scrollLeft +=
    event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
};

/** Capy's lightbox strip: virtualised thumbnails, centred on the current one. */
export function LightboxStrip<T extends MediaLightboxEntry>({
  entries,
  index,
  onIndexChange,
  renderThumbnail,
}: LightboxStripProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef(index);
  const scrolled = useRef(false);
  const count = entries.length;
  const [range, setRange] = useState({ start: 0, end: 0 });

  const measure = (element: HTMLElement) => {
    const next = stripWindow(element.scrollLeft, element.clientWidth, count);
    setRange((previous) =>
      previous.start === next.start && previous.end === next.end
        ? previous
        : next,
    );
  };

  const center = useEffectEvent(
    (element: HTMLElement, behavior: ScrollBehavior) => {
      if (element.clientWidth === 0) return;
      element.scrollTo({
        left:
          current.current * STRIP_STRIDE -
          (element.clientWidth - STRIP_THUMB) / 2,
        behavior,
      });
      scrolled.current = true;
      if (behavior === "instant") measure(element);
    },
  );

  useLayoutEffect(() => {
    current.current = index;
    const element = ref.current;
    if (!element) return;
    center(
      element,
      scrolled.current &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "instant",
    );
  }, [index]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => center(element, "instant"));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's strip is a scrolling div with role=group, not a form fieldset
    <div
      ref={ref}
      data-slot="lightbox-strip"
      role="group"
      aria-label="Thumbnails"
      className="absolute bottom-3 left-1/2 hidden max-w-[calc(100vw-30rem)] -translate-x-1/2 overflow-x-auto scrollbar-hide [--scroll-fade-ramp:1.5rem] sm:flex md:scroll-fade-x"
      onScroll={(event: UIEvent<HTMLDivElement>) =>
        measure(event.currentTarget)
      }
      onWheel={scrollStripHorizontally}
    >
      <div
        className="relative h-12 shrink-0"
        style={{ width: count * STRIP_STRIDE - (STRIP_STRIDE - STRIP_THUMB) }}
      >
        {entries.slice(range.start, range.end).map((item, offset) => {
          const position = range.start + offset;
          return (
            <button
              key={item.key}
              type="button"
              aria-label={`Show ${item.label}`}
              aria-current={position === index ? "true" : undefined}
              tabIndex={position === index ? 0 : -1}
              onClick={() => onIndexChange(position)}
              style={{ left: position * STRIP_STRIDE }}
              className="absolute top-0 flex size-12 items-center justify-center overflow-hidden rounded-(--radius) text-overlay-fg opacity-50 transition-opacity duration-100 after:pointer-events-none after:absolute after:inset-px after:rounded-[inherit] after:border-2 after:border-overlay-fg after:opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-ring-inset aria-[current=true]:opacity-100 aria-[current=true]:after:opacity-100"
            >
              {renderThumbnail(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Lets a video player hand the lightbox a "copy current frame" action. */
export type MediaLightboxFrame = { copyFrame?: () => void };

export const MediaLightboxFrameContext = createContext<
  MediaLightboxFrame | undefined
>(undefined);

export type MediaLightboxActionsProps = MediaSource;

/** Copy and download buttons for the lightbox toolbar (renderActions). */
export function MediaLightboxActions(props: MediaLightboxActionsProps) {
  const frame = useContext(MediaLightboxFrameContext);
  const actions = mediaActions(props);
  const image = props.kind === "image";
  const copy = image ? actions.copy : frame?.copyFrame;
  useMediaShortcut("preview.copy", () => copy?.(), image || copy !== undefined);
  useMediaShortcut("preview.download", () => actions.download?.(), image);
  return (
    <>
      {image || copy !== undefined ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-sm"
                aria-label={`Copy ${props.name}`}
                disabled={copy === undefined}
                onClick={copy}
              >
                <Icon name="square-behind-square-2" />
              </Button>
            }
          />
          <TooltipContent>
            {image ? "Copy image" : "Copy frame"}
            <span data-slot="tooltip-shortcut">
              {mediaShortcutLabel("preview.copy")}
            </span>
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              aria-label={`Download ${props.name}`}
              disabled={actions.download === undefined}
              onClick={actions.download}
            >
              <Icon name="arrow-inbox" />
            </Button>
          }
        />
        <TooltipContent>
          {image ? "Download image" : "Download video"}
          {image ? (
            <span data-slot="tooltip-shortcut">
              {mediaShortcutLabel("preview.download")}
            </span>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </>
  );
}

/** Class strings Capy gives lightbox media and strip thumbnails. */
export const lightboxImageClassName =
  "max-h-[calc(100dvh-6rem-var(--lightbox-strip,0rem))] max-w-[calc(100vw-2*var(--lightbox-gutter,1.5rem))] rounded-(--radius-card) object-contain";
export const lightboxVideoClassName =
  "max-h-[calc(100dvh-9rem-var(--lightbox-strip,0rem))] max-w-[calc(100vw-2*var(--lightbox-gutter,1.5rem))] rounded-(--radius-card) object-contain";
export const lightboxThumbnailClassName = "size-full object-cover";

/** A muted first-frame video thumbnail with a small play badge. */
export function LightboxVideoThumbnail({ src }: { src: string }) {
  return (
    <>
      <video
        src={`${src}#t=0.001`}
        muted
        playsInline
        preload="metadata"
        className={lightboxThumbnailClassName}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex size-4 items-center justify-center rounded-full bg-overlay text-overlay-fg">
          <Icon name="play" className="size-2" />
        </span>
      </span>
    </>
  );
}
