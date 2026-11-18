import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type MarkdownChipsContextValue,
  MarkdownChipsProvider,
} from "@/components/markdown-chips";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import type { TimelineRow as TimelineRowData } from "@/data/events";
import {
  AttachmentSourceProvider,
  apiAttachmentSource,
  pendingAttachmentSource,
} from "@/features/thread/attachment-gallery/attachment-source";
import { QuoteSelectionLayer } from "@/features/thread/quote-selection";
import type { ExcerptMention } from "@/features/thread/reply-quote";
import { TimelineRow } from "@/features/thread/timeline-row";
import { anchorShift, type ChatAnchor, positionOf } from "./anchor";
import { ChatScrollPill } from "./chat-scroll-pill";
import { ChatStamp } from "./chat-stamp";
import { type ChatJump, type JumpList, jumpToRow } from "./jump-to-row";
import {
  computeRowGaps,
  countMessagesBelow,
  defaultGap,
  type RowGap,
  rowGapStyle,
  rowKey,
} from "./row-gaps";

export { ChatScrollPill, type ChatScrollPillProps } from "./chat-scroll-pill";

/** How close to the bottom still counts as reading the end, so new rows keep pinning there. */
const END_TOLERANCE = 8;
/** How close to the top asks for the page before it. */
const START_TOLERANCE = 24;
/** Scrolling back past this re-arms the older-page request. */
const START_REARM = 240;

const chatScroller =
  "chat-scroller md:scroll-fade-y h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain [overflow-anchor:none] [&>div>div:has(>[data-chat-row-id]):focus-within]:z-(--z-chat-row-lift) [&>div>div:has(>[data-chat-row-id]):focus-within]:[contain:layout_style]! [&>div>div:has(>[data-chat-row-id]):hover]:z-(--z-chat-row-lift) [&>div>div:has(>[data-chat-row-id]):hover]:[contain:layout_style]! [&>div>div:has(>[data-chat-row-id]):has([data-popup-open])]:z-(--z-chat-row-lift) [&>div>div:has(>[data-chat-row-id]):has([data-popup-open])]:[contain:layout_style]! md:pointer-coarse:[&>div>div:has(>[data-chat-row-id]):has([data-slot=user-message])]:[contain:layout_style]!";

type ChatRowContext = { gaps: ReadonlyMap<string, RowGap>; now?: number };
const RowContext = createContext<ChatRowContext>({ gaps: new Map() });

/** No references resolved: every code stays the text it was written as. */
const emptyChips: MarkdownChipsContextValue = {};

function ChatRow({ row }: { row: TimelineRowData }) {
  const { gaps, now } = useContext(RowContext);
  const key = rowKey(row);
  const gap = gaps.get(key);
  return (
    <div
      data-chat-row-id={key}
      className="mx-auto w-full max-w-4xl min-w-0 px-4 pt-(--row-gap) max-md:pt-(--row-gap-narrow)"
      style={rowGapStyle(gap?.gap ?? defaultGap(row))}
    >
      {gap?.stamp !== undefined && <ChatStamp at={gap.stamp} now={now} />}
      <TimelineRow row={row} />
    </div>
  );
}

export type JamChatProps = ComponentProps<"div"> & {
  jamId?: string;
  /** What this transcript knows about the references in its text. */
  chips?: MarkdownChipsContextValue;
  rows?: readonly TimelineRowData[];
  header?: ReactNode;
  initialLoading?: boolean;
  now?: number;
  /** Called when the list scrolls to its newest-first start, to page older history in. */
  onStartReached?: () => void;
  /** Puts an excerpt chip from a quoted selection into the composer. */
  onInsertQuote?: (mention: ExcerptMention) => void;
  /** Scrolls to a quoted row and focuses its section; a new `request` jumps again. */
  jump?: ChatJump;
};

const scrollAdapter = (node: HTMLElement): JumpList => ({
  scrollToOffset: ({ offset, animated }) => {
    node.scrollTo({
      top: offset,
      behavior: animated === true ? "smooth" : "auto",
    });
  },
});

/**
 * The thread's chat timeline: rows with stamps and row gaps, held in place by
 * the row at the top edge rather than by `overflow-anchor`, plus the
 * scroll-to-end pill. Every row is mounted, as Capy's own transcript does —
 * the anchoring is what keeps a page of older history or a growing row from
 * moving what is being read.
 */
export function JamChat({
  jamId,
  chips,
  rows = [],
  header,
  initialLoading = false,
  now,
  onStartReached,
  onInsertQuote,
  jump,
  className,
  style,
  children,
  ...props
}: JamChatProps) {
  const selectedOrgId = useAtomValue(selectedOrgIdAtom);
  const organizations = useAtomValue(organizationsAtom);
  const attachmentSource = useMemo(() => {
    const orgId = resolveActiveOrgId(
      Option.getOrUndefined(AsyncResult.value(organizations)) ?? [],
      selectedOrgId,
    );
    return orgId === undefined || jamId === undefined
      ? pendingAttachmentSource
      : apiAttachmentSource(orgId, jamId);
  }, [jamId, organizations, selectedOrgId]);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const gaps = useMemo(() => computeRowGaps(rows), [rows]);
  const context = useMemo(() => ({ gaps, now }), [gaps, now]);
  const [atEnd, setAtEnd] = useState(true);
  const [lastVisibleKey, setLastVisibleKey] = useState<string | null>(null);
  const rowList = useMemo(
    () =>
      rows.map((row) => (
        <div key={rowKey(row)} data-chat-row-slot="">
          <ChatRow row={row} />
        </div>
      )),
    [rows],
  );

  const scroller = useRef<HTMLDivElement | null>(null);
  const slots = useRef<readonly HTMLElement[]>([]);
  const anchor = useRef<ChatAnchor | null>(null);
  const pinned = useRef(true);
  const armed = useRef(true);
  const jam = useRef(jamId);
  const rowsRef = useRef(rows);
  const startReached = useRef(onStartReached);
  startReached.current = onStartReached;

  /** Row tops in content coordinates, as of the current layout. */
  const topOf = useCallback((node: HTMLElement) => {
    const origin = node.getBoundingClientRect().top - node.scrollTop;
    return (index: number) => {
      const slot = slots.current[index];
      return slot === undefined ? 0 : slot.getBoundingClientRect().top - origin;
    };
  }, []);

  /** Reads the visible position and keeps the pill and the older-page request honest. */
  const sync = useCallback(
    (node: HTMLElement) => {
      const position = positionOf(
        rowsRef.current,
        node.scrollTop,
        node.clientHeight,
        topOf(node),
      );
      anchor.current = position.anchor;
      setLastVisibleKey(position.lastVisibleKey);
      pinned.current =
        node.scrollHeight - node.scrollTop - node.clientHeight <= END_TOLERANCE;
      setAtEnd(pinned.current);
      if (node.scrollTop <= START_TOLERANCE) {
        if (armed.current) {
          armed.current = false;
          startReached.current?.();
        }
      } else if (node.scrollTop > START_REARM) {
        armed.current = true;
      }
    },
    [topOf],
  );

  const handleScroll = useCallback(() => {
    const node = scroller.current;
    if (node !== null) sync(node);
  }, [sync]);

  /** Holds the reader's place: the end while reading it, else the anchored row. */
  const hold = useCallback(
    (node: HTMLElement) => {
      if (pinned.current) {
        node.scrollTop = node.scrollHeight;
        return;
      }
      if (anchor.current === null) return;
      const shift = anchorShift(
        anchor.current,
        rowsRef.current,
        node.scrollTop,
        topOf(node),
      );
      if (shift !== null && Math.abs(shift) >= 1) node.scrollTop += shift;
    },
    [topOf],
  );

  useLayoutEffect(() => {
    const node = scroller.current;
    if (node === null) return;
    rowsRef.current = rows;
    slots.current = Array.from(
      node.querySelectorAll<HTMLElement>("[data-chat-row-slot]"),
    );
    if (jam.current !== jamId) {
      jam.current = jamId;
      pinned.current = true;
      anchor.current = null;
      armed.current = true;
    }
    hold(node);
    sync(node);
  }, [jamId, rows, hold, sync]);

  useLayoutEffect(() => {
    const node = scroller.current;
    const content = node?.firstElementChild;
    if (node === null || !(content instanceof HTMLElement)) return;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => hold(node));
    observer.observe(content);
    return () => observer.disconnect();
  }, [hold]);

  useEffect(() => {
    if (jump === undefined) return;
    const scroll = scroller.current;
    if (scroll === null) return;
    const adapter = scrollAdapter(scroll);
    if (jumpToRow(adapter, scroll, jump) !== null) return;
    const frame = requestAnimationFrame(() => {
      jumpToRow(adapter, scroll, jump);
    });
    return () => cancelAnimationFrame(frame);
  }, [jump]);

  const showPill = !atEnd && rows.length > 0;
  const hidden = initialLoading && rows.length === 0;

  return (
    <div
      className={cx("relative flex h-full min-h-0 flex-col", className)}
      data-scroll-restoration-ignore=""
      style={hidden ? { ...style, visibility: "hidden" } : style}
      {...props}
      ref={setViewport}
    >
      <AttachmentSourceProvider source={attachmentSource}>
        <MarkdownChipsProvider value={chips ?? emptyChips}>
          <RowContext.Provider value={context}>
            <div
              ref={scroller}
              data-slot="chat-scroller"
              onScroll={handleScroll}
              className={chatScroller}
            >
              <div>
                {header !== undefined && (
                  <div>
                    {header}
                    <div className="h-3" />
                  </div>
                )}
                {rowList}
                <div className="pb-8 max-md:pb-7" />
              </div>
            </div>
          </RowContext.Provider>
        </MarkdownChipsProvider>
      </AttachmentSourceProvider>
      {children}
      {onInsertQuote !== undefined && (
        <QuoteSelectionLayer
          container={viewport}
          onInsertQuote={onInsertQuote}
        />
      )}
      <ChatScrollPill
        visible={showPill}
        messagesBelow={countMessagesBelow(
          rows,
          showPill ? lastVisibleKey : null,
        )}
        onClick={() =>
          scroller.current?.scrollTo({
            top: scroller.current.scrollHeight,
            behavior: "smooth",
          })
        }
      />
    </div>
  );
}
