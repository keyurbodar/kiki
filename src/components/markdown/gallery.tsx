import { cx } from "class-variance-authority";
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { ImageUnavailable } from "@/components/media-gallery";

/** A video or image the lightbox can open, in message order. */
export type MarkdownMedia = {
  kind: "image" | "video";
  src: string;
  label?: string;
};

/**
 * Lightbox wiring for markdown media. The thread view provides it; without
 * a provider, images and videos stay inline.
 */
export type MarkdownMediaHandlers = {
  /** An image tile was clicked: `index` into `items`. */
  onOpen?: (items: MarkdownMedia[], index: number) => void;
};

const MarkdownMediaContext = createContext<MarkdownMediaHandlers>({});

export function MarkdownMediaProvider({
  value,
  children,
}: {
  value: MarkdownMediaHandlers;
  children?: ReactNode;
}) {
  return (
    <MarkdownMediaContext.Provider value={value}>
      {children}
    </MarkdownMediaContext.Provider>
  );
}

export const useMarkdownMedia = () => useContext(MarkdownMediaContext);

export type GallerySize = { width: number; height: number };
export type GalleryTileKind = "pair" | "hero" | "stack" | "grid" | "fit";

/** Images narrower than 3:4 crop to the top and fade out at the bottom. */
export const TALL_RATIO = 3 / 4;
/** Widest aspect a tile keeps in a fitted row. */
export const MAX_FIT_RATIO = 3;
/** Tiles shown before the rest collapse into "+N". */
export const VISIBLE_TILES = 4;

const tile =
  "relative overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-secondary";

const tileKinds: Record<GalleryTileKind, string> = {
  pair: "aspect-[4/3] min-w-0 flex-1",
  hero: "min-w-0 flex-[1.5]",
  stack: "min-h-0 w-full flex-1",
  grid: "aspect-video min-w-0 flex-1",
  fit: "min-w-0",
};

const fill =
  "[&_[data-slot=image-unavailable]]:size-full [&_[role=status]]:size-full [&_img]:size-full [&_img]:object-cover [&_img]:object-top";

export const isTall = (size: GallerySize | undefined) =>
  size !== undefined && size.width / size.height < TALL_RATIO;

export function singleImageStyle(size: GallerySize): CSSProperties {
  const ratio = Math.max(size.width / size.height, TALL_RATIO);
  return {
    width: `min(100%, var(--media-box-w), ${size.width}px, calc(var(--media-box-h) * ${ratio}))`,
    aspectRatio: `${ratio}`,
  };
}

export const fitRatio = (size: GallerySize) =>
  Math.min(Math.max(size.width / size.height, TALL_RATIO), MAX_FIT_RATIO);

/**
 * Rows for the fitted layout, used when every visible image has a known
 * size (2 or 4+ images): two wide images stack, otherwise rows of two.
 */
export function fitRows(
  count: number,
  ratios: number[],
): number[][] | undefined {
  if (
    count < 2 ||
    count === 3 ||
    ratios.length !== Math.min(count, VISIBLE_TILES)
  )
    return undefined;
  if (count === 2)
    return (ratios[0] ?? 0) + (ratios[1] ?? 0) > 4 ? [[0], [1]] : [[0, 1]];
  return [
    [0, 1],
    [2, 3],
  ];
}

const sizeOf = (node: ReactNode): GallerySize | undefined => {
  if (!isValidElement<{ width?: unknown; height?: unknown }>(node))
    return undefined;
  const width = Number(node.props.width);
  const height = Number(node.props.height);
  return width > 0 && height > 0 ? { width, height } : undefined;
};

const srcOf = (node: ReactNode) =>
  isValidElement<{ src?: unknown; alt?: unknown }>(node) &&
  typeof node.props.src === "string"
    ? {
        src: node.props.src,
        label: typeof node.props.alt === "string" ? node.props.alt : undefined,
      }
    : undefined;

function Fade() {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-secondary to-transparent" />
  );
}

export type MarkdownGalleryProps = ComponentProps<"div"> & {
  /** Overrides the provider's onOpen for this gallery. */
  onOpen?: MarkdownMediaHandlers["onOpen"];
};

/**
 * Capy's markdown gallery: a run of image-only paragraphs laid out by count
 * (one, pair, hero + stack, 2x2 grid with "+N"), or fitted rows when every
 * image carries width and height.
 */
export function MarkdownGallery({
  children,
  onOpen,
  className,
  ...props
}: MarkdownGalleryProps) {
  const handlers = useMarkdownMedia();
  const open = onOpen ?? handlers.onOpen;
  const [failed, setFailed] = useState<ReadonlySet<number>>(new Set());
  const items = Children.toArray(children);
  const sizes = items.map(sizeOf);
  const media = items.flatMap((node) => {
    const found = srcOf(node);
    return found === undefined ? [] : [{ kind: "image" as const, ...found }];
  });
  // Position in `media` per item, so repeat images of the same src open themselves.
  const mediaIndex: number[] = [];
  for (const node of items)
    mediaIndex.push(
      srcOf(node) === undefined
        ? -1
        : mediaIndex.filter((at) => at >= 0).length,
    );

  const content = (index: number) =>
    failed.has(index) ? <ImageUnavailable /> : items[index];

  const interactions = (index: number) =>
    ({
      onError: () => setFailed((prev) => new Set(prev).add(index)),
      onClick:
        open === undefined || failed.has(index)
          ? undefined
          : () => {
              const at = mediaIndex[index] ?? -1;
              if (at >= 0) open(media, at);
            },
      "data-gallery-index": index,
    }) as const;

  if (items.length === 1) {
    const size = sizes[0];
    return size === undefined ? (
      <span
        data-slot="markdown-gallery"
        className={cx(
          tile,
          "block w-fit max-w-(--media-box-w) [&_img]:block [&_img]:max-h-(--media-box-h) [&_img]:w-auto [&_img]:max-w-full",
          className,
        )}
        {...interactions(0)}
      >
        {content(0)}
      </span>
    ) : (
      <span
        data-slot="markdown-gallery"
        className={cx(tile, "block", fill, className)}
        style={singleImageStyle(size)}
        {...interactions(0)}
      >
        {content(0)}
        {isTall(size) ? <Fade /> : null}
      </span>
    );
  }

  const renderTile = (
    index: number,
    kind: GalleryTileKind,
    more?: number,
    style?: CSSProperties,
  ) => (
    <span
      key={index}
      className={cx(tile, tileKinds[kind], fill)}
      style={style}
      {...interactions(index)}
    >
      {content(index)}
      {isTall(sizes[index]) ? <Fade /> : null}
      {more !== undefined && more > 0 ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-overlay text-lg font-medium text-overlay-fg">
          +{more}
        </span>
      ) : null}
    </span>
  );

  const count = items.length;
  const ratios = sizes
    .slice(0, Math.min(count, VISIBLE_TILES))
    .flatMap((size) => (size === undefined ? [] : [fitRatio(size)]));
  const rows = fitRows(count, ratios);

  let layout: ReactNode = null;
  if (rows !== undefined) {
    const height =
      count === 2 ? "var(--media-box-h)" : "calc(var(--media-box-h) * 0.6)";
    layout = (
      <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
        {rows.map((row) => {
          const total = row.reduce((sum, i) => sum + (ratios[i] ?? 0), 0);
          return (
            <div
              key={row[0]}
              className="flex gap-1"
              style={{
                width: `min(100%, calc(${total} * ${height} + ${row.length - 1} * 0.25rem))`,
              }}
            >
              {row.map((i) =>
                renderTile(
                  i,
                  "fit",
                  i === 3 ? count - VISIBLE_TILES : undefined,
                  {
                    flex: `${ratios[i]} 1 0%`,
                    aspectRatio: `${ratios[i]}`,
                  },
                ),
              )}
            </div>
          );
        })}
      </div>
    );
  } else if (count === 2) {
    layout = (
      <div className="flex w-full max-w-(--media-box-w) gap-1">
        {renderTile(0, "pair")}
        {renderTile(1, "pair")}
      </div>
    );
  } else if (count === 3) {
    layout = (
      <div className="flex aspect-[2/1] w-full max-w-(--media-box-w) gap-1">
        {renderTile(0, "hero")}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {renderTile(1, "stack")}
          {renderTile(2, "stack")}
        </div>
      </div>
    );
  } else if (count >= VISIBLE_TILES) {
    layout = (
      <div className="flex w-full max-w-(--media-box-w) flex-col gap-1">
        <div className="flex gap-1">
          {renderTile(0, "grid")}
          {renderTile(1, "grid")}
        </div>
        <div className="flex gap-1">
          {renderTile(2, "grid")}
          {renderTile(3, "grid", count - VISIBLE_TILES)}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="markdown-gallery" className={className} {...props}>
      {layout}
      {count > VISIBLE_TILES ? (
        <span hidden>{items.slice(VISIBLE_TILES)}</span>
      ) : null}
    </div>
  );
}
