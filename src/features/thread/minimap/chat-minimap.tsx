import { type ReactNode, useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Minimap } from "@/components/minimap";
import type { Actor, Origin } from "@/data/events";

/** One user message on the chat's minimap. */
export type ChatMinimapItem = {
  id: string;
  /** Key of the timeline row to scroll to. */
  jumpKey: string;
  /** Index of that row in the list, or null while it isn't loaded. */
  rowIndex: number | null;
  text: string;
  /** The agent's reply, shortened for the preview. */
  answer: string | null;
  /** Sent by the person viewing, so the preview skips the avatar. */
  viewer: boolean;
  actor: Actor;
  origin: Origin;
};

/** Chat column width in CSS pixels (container-4xl, 56rem). */
const CHAT_COLUMN = 896;
/** The rail stays visible when the gutter beside the column is this wide. */
const PERSISTENT_GUTTER = 48;
const HIT_STRIP_INSET = 12;
const HIT_STRIP_MAX = 40;
const ANSWER_MAX = 800;

/** Width of the empty gutter on each side of the centred chat column. */
export const chatGutter = (width: number) =>
  !Number.isFinite(width) || width <= 0
    ? 0
    : Math.max(0, (width - Math.min(width, CHAT_COLUMN)) / 2);

export const isMinimapPersistent = (width: number) =>
  chatGutter(width) >= PERSISTENT_GUTTER;

export const minimapHitStrip = (width: number) =>
  Math.max(
    0,
    Math.min(HIT_STRIP_MAX, Math.floor(chatGutter(width)) - HIT_STRIP_INSET),
  );

/** The answer as the preview shows it: trimmed to 800 characters, or null. */
export const minimapAnswer = (text: string | null) =>
  text === null || text.trim().length === 0
    ? null
    : text.length <= ANSWER_MAX
      ? text
      : `${text.slice(0, ANSWER_MAX).trimEnd()}…`;

export const minimapItemText = (item: ChatMinimapItem) =>
  item.text.trim().length === 0 ? "User message" : item.text;

export const minimapLabel = (item: ChatMinimapItem | null) =>
  `Jump to message: ${(item === null ? "User message" : minimapItemText(item)).replace(/\s+/g, " ").trim()}`;

/** Items compare by content, so a re-derived list keeps its identity. */
export const sameMinimapItems = (
  a: readonly ChatMinimapItem[],
  b: readonly ChatMinimapItem[],
) =>
  a.length === b.length &&
  a.every((item, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      item.id === other.id &&
      item.jumpKey === other.jumpKey &&
      item.rowIndex === other.rowIndex &&
      item.text === other.text &&
      item.viewer === other.viewer &&
      item.actor === other.actor &&
      item.origin === other.origin
    );
  });

/** Whether row `index` overlaps the list's viewport. */
export const isRowInView = (
  list: {
    scroll: number;
    scrollLength: number;
    positionAtIndex: (index: number) => number | undefined;
    sizeAtIndex: (index: number) => number | undefined;
  },
  index: number,
) => {
  const position = list.positionAtIndex(index);
  if (position === undefined || !Number.isFinite(position)) return false;
  const size = list.sizeAtIndex(index);
  const length =
    size !== undefined && Number.isFinite(size) ? Math.max(1, size) : 1;
  return (
    position < list.scroll + list.scrollLength &&
    position + length > list.scroll
  );
};

export type ChatMinimapProps = {
  items: readonly ChatMinimapItem[];
  tickMap: Map<string, HTMLElement>;
  onSelect: (item: ChatMinimapItem) => void;
  /** Sender avatar for messages from someone else. */
  renderAvatar?: (item: ChatMinimapItem) => ReactNode;
};

/**
 * features/thread/minimap: one tick per user message beside the chat. It
 * stays visible once the gutter beside the chat column is wide enough.
 */
export function ChatMinimap({
  items,
  tickMap,
  onSelect,
  renderAvatar,
}: ChatMinimapProps) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const [fit, setFit] = useState({ persistent: false, hitStripWidth: 0 });
  const [stable, setStable] = useState(items);
  const same = stable === items || sameMinimapItems(stable, items);
  if (!same) setStable(items);

  const host = anchor?.parentElement;
  useEffect(() => {
    if (host == null) return;
    const measure = () => {
      const width = host.getBoundingClientRect().width;
      setFit((current) => {
        const next = {
          persistent: isMinimapPersistent(width),
          hitStripWidth: minimapHitStrip(width),
        };
        return current.persistent === next.persistent &&
          current.hitStripWidth === next.hitStripWidth
          ? current
          : next;
      });
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [host]);

  return (
    <>
      <div
        ref={setAnchor}
        className="pointer-events-none absolute inset-x-0 top-0 h-0"
      />
      <Minimap
        items={same ? stable : items}
        tickMap={tickMap}
        persistent={fit.persistent}
        reveal="pointer"
        hitStripWidth={fit.hitStripWidth}
        label={minimapLabel}
        onSelect={onSelect}
        renderPreview={(item, index) => {
          const current =
            items[index]?.id === item.id ? (items[index] ?? item) : item;
          return (
            <>
              <div className="flex items-center gap-1.5">
                {!current.viewer && renderAvatar?.(current)}
                <Markdown
                  text={minimapItemText(current)}
                  variant="inline"
                  size="sm"
                  weight="medium"
                  className="min-w-0 flex-1 truncate"
                />
              </div>
              {current.answer !== null && (
                <Markdown
                  text={current.answer}
                  variant="inline"
                  size="sm"
                  tone="muted"
                  className="mt-1 line-clamp-3"
                />
              )}
            </>
          );
        }}
      />
    </>
  );
}
