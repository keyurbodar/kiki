import { useAtomValue } from "@effect/atom-react";
import {
  LegendList,
  type LegendListRef,
  type ViewToken,
} from "@legendapp/list/react";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { TimelineRow } from "@/features/thread/timeline-row";
import { ChatScrollPill } from "./chat-scroll-pill";
import { ChatStamp } from "./chat-stamp";
import {
  computeRowGaps,
  countMessagesBelow,
  defaultGap,
  type RowGap,
  rowGapStyle,
  rowKey,
} from "./row-gaps";

export { ChatScrollPill, type ChatScrollPillProps } from "./chat-scroll-pill";

const ESTIMATED_ROW_SIZE = 76;
const DRAW_DISTANCE = 1500;
const END_TOLERANCE = 8;

const chatScroller =
  "chat-scroller md:scroll-fade-y h-full min-h-0 overflow-x-hidden overscroll-y-contain [overflow-anchor:none] [&>div>div>div:has(>[data-chat-row-id]):focus-within]:z-(--z-chat-row-lift) [&>div>div>div:has(>[data-chat-row-id]):focus-within]:[contain:layout_style]! [&>div>div>div:has(>[data-chat-row-id]):hover]:z-(--z-chat-row-lift) [&>div>div>div:has(>[data-chat-row-id]):hover]:[contain:layout_style]! [&>div>div>div:has(>[data-chat-row-id]):has([data-popup-open])]:z-(--z-chat-row-lift) [&>div>div>div:has(>[data-chat-row-id]):has([data-popup-open])]:[contain:layout_style]! md:pointer-coarse:[&>div>div>div:has(>[data-chat-row-id]):has([data-slot=user-message])]:[contain:layout_style]!";

type ChatRowContext = { gaps: ReadonlyMap<string, RowGap>; now?: number };
const RowContext = createContext<ChatRowContext>({ gaps: new Map() });

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

const renderRow = ({ item }: { item: TimelineRowData }) => (
  <ChatRow row={item} />
);

const itemType = (row: TimelineRowData) =>
  row.type === "update" ? `update:${row.kind}` : row.type;

export type JamChatProps = ComponentProps<"div"> & {
  jamId?: string;
  rows?: readonly TimelineRowData[];
  header?: ReactNode;
  initialLoading?: boolean;
  now?: number;
  /** Called when the list scrolls to its newest-first start, to page older history in. */
  onStartReached?: () => void;
};

/** The thread's chat timeline: a virtualised list of rows with stamps, row gaps and the scroll-to-end pill. */
export function JamChat({
  jamId,
  rows = [],
  header,
  initialLoading = false,
  now,
  onStartReached,
  className,
  style,
  children,
  ...props
}: JamChatProps) {
  const listRef = useRef<LegendListRef>(null);
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
  const gaps = useMemo(() => computeRowGaps(rows), [rows]);
  const context = useMemo(() => ({ gaps, now }), [gaps, now]);
  const [atEnd, setAtEnd] = useState(true);
  const [lastVisibleKey, setLastVisibleKey] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    const node = listRef.current?.getScrollableNode();
    if (!node) return;
    setAtEnd(
      node.scrollHeight - node.scrollTop - node.clientHeight <= END_TOLERANCE,
    );
  }, []);

  const handleViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<TimelineRowData>[] }) => {
      const last = viewableItems.at(-1);
      setLastVisibleKey(last === undefined ? null : rowKey(last.item));
    },
    [],
  );

  const showPill = !atEnd && rows.length > 0;
  const hidden = initialLoading && rows.length === 0;

  return (
    <div
      className={cx("relative flex h-full min-h-0 flex-col", className)}
      data-scroll-restoration-ignore=""
      style={hidden ? { ...style, visibility: "hidden" } : style}
      {...props}
    >
      <AttachmentSourceProvider source={attachmentSource}>
        <RowContext.Provider value={context}>
          <LegendList
            ref={listRef}
            data={rows as TimelineRowData[]}
            dataKey={jamId}
            keyExtractor={rowKey}
            getItemType={itemType}
            renderItem={renderRow}
            estimatedItemSize={ESTIMATED_ROW_SIZE}
            drawDistance={DRAW_DISTANCE}
            initialScrollAtEnd
            maintainScrollAtEnd
            maintainVisibleContentPosition
            onScroll={handleScroll}
            onViewableItemsChanged={handleViewable}
            onStartReached={onStartReached}
            className={chatScroller}
            ListHeaderComponent={
              <div>
                {header}
                <div className="h-3" />
              </div>
            }
            ListFooterComponent={<div className="pb-8 max-md:pb-7" />}
          />
        </RowContext.Provider>
      </AttachmentSourceProvider>
      {children}
      <ChatScrollPill
        visible={showPill}
        messagesBelow={countMessagesBelow(
          rows,
          showPill ? lastVisibleKey : null,
        )}
        onClick={() => listRef.current?.scrollToEnd({ animated: true })}
      />
    </div>
  );
}
