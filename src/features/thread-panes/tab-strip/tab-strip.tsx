import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { MenuSeparator } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuLevel,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { PlusGlyph } from "./glyphs";
import { RailMenuItems, type SplitDirection } from "./rail-menu-items";
import { matchesShortcut, SHORTCUTS } from "./shortcut";
import { ChatTab, PaneTabButton, type TabSignals } from "./tab-button";
import { tabIcon } from "./tab-icon";
import {
  CHAT_TAB_ID,
  type PaneTab,
  type RailTab,
  reorderBefore,
  tabKey,
  tabLabel,
} from "./tabs";
import { ThreadOptions, type ThreadOptionsProps } from "./thread-options";
import "./tab-strip.css";

/** The pinned chat tab at the head of a main strip. */
export type StripChatTab = {
  title: string;
  content: ReactNode;
  preview?: ReactNode;
  onSelect: () => void;
};

/** What the open-a-tab menu lists beyond the strip's own tabs. */
export type TabMenuOptions = Omit<
  ThreadOptionsProps,
  "openIds" | "onOpen" | "onOpenBrowser"
>;

export type TabStripProps = ComponentProps<"div"> & {
  threadId?: string;
  tabs?: readonly PaneTab[];
  activeId?: string | null;
  chatTab?: StripChatTab;
  /** Preview tabs: shown in italics until pinned. */
  transientIds?: readonly string[];
  closeShortcutTarget?: string;
  menu?: TabMenuOptions;
  autoClose?: boolean;
  labelFor?: (tab: PaneTab) => string | undefined;
  iconFor?: (tab: PaneTab) => ReactNode;
  previewFor?: (tab: PaneTab) => ReactNode;
  signalsFor?: (tab: PaneTab) => TabSignals | undefined;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onCloseTabs?: (ids: readonly string[], keep: string | undefined) => void;
  onReopenTab?: () => void;
  onPinTab?: (id: string) => void;
  onReorderTab?: (id: string, before: string | undefined) => void;
  onSplitTab?: (id: string, direction: SplitDirection) => void;
  onOpenTab?: (tab: PaneTab) => void;
  onOpenBrowser?: () => void;
  onAutoCloseChange?: (autoClose: boolean) => void;
};

const noop = () => {};

/** Opens the strip's context menu from the keyboard (Menu key, Shift+F10). */
function openContextMenuFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  if (
    (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) ||
    !(event.target instanceof Element)
  ) {
    return;
  }
  event.preventDefault();
  const rect = event.target.getBoundingClientRect();
  event.target.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

/** Keeps data-overflowing and the edge fades in step with the scroll. */
function useOverflowFades(key: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    void key;
    const scroller = ref.current;
    if (scroller === null) return;
    const update = () => {
      const overflowing = scroller.scrollWidth > scroller.clientWidth + 1;
      scroller.dataset.overflowing = String(overflowing);
      scroller.dataset.fadeLeft = String(
        overflowing && scroller.scrollLeft > 1,
      );
      scroller.dataset.fadeRight = String(
        overflowing &&
          scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
      );
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "undefined") {
      return () => scroller.removeEventListener("scroll", update);
    }
    let width = scroller.clientWidth;
    const observer = new ResizeObserver(() => {
      update();
      const previous = width;
      width = scroller.clientWidth;
      if (width !== previous) {
        scroller
          .querySelector("[data-selected]")
          ?.scrollIntoView?.({ inline: "nearest", block: "nearest" });
      }
    });
    observer.observe(scroller);
    for (const child of Array.from(scroller.children)) observer.observe(child);
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [key]);
  return ref;
}

type SortableTabProps = Omit<ComponentProps<typeof PaneTabButton>, "dragging">;

function SortableTab(props: SortableTabProps) {
  const id = tabKey(props.tab);
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id });
  return (
    <span
      ref={setNodeRef}
      style={{
        translate: transform === null ? undefined : `${transform.x}px 0`,
        transition: transition ?? undefined,
      }}
      className={
        isDragging
          ? "shrink-0 opacity-40 motion-reduce:transition-none!"
          : "shrink-0 motion-reduce:transition-none!"
      }
      {...attributes}
      {...listeners}
    >
      <PaneTabButton {...props} dragging={isDragging} />
    </span>
  );
}

type PlusMenuProps = {
  options: ThreadOptionsProps;
};

/** The + button after the tabs that opens the open-a-tab menu. */
function PlusMenu({ options }: PlusMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveMenu open={open} onOpenChange={setOpen}>
      <ResponsiveMenuTrigger
        data-track-owner="features/thread/pane/tab-strip.tsx#PlusMenu:ResponsiveMenuTrigger.1"
        render={
          <Button
            data-track-owner="features/thread/pane/tab-strip.tsx#PlusMenu:Button[Open a tab]"
            variant="ghost"
            size="icon-sm"
            aria-label="Open a tab"
          >
            <PlusGlyph />
          </Button>
        }
      />
      <ResponsiveMenuContent align="end" className="w-80">
        <ThreadOptions
          {...options}
          onOpen={(tab) => {
            setOpen(false);
            options.onOpen(tab);
          }}
          onOpenBrowser={() => {
            setOpen(false);
            options.onOpenBrowser();
          }}
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

/**
 * A thread pane's tab strip: the pinned chat tab, the sortable tabs with
 * hover close, the + menu that opens a tab, and the right-click menu.
 */
export function TabStrip({
  threadId = "",
  tabs = [],
  activeId = null,
  chatTab,
  transientIds = [],
  closeShortcutTarget,
  menu,
  autoClose = false,
  labelFor,
  iconFor,
  previewFor,
  signalsFor,
  onSelectTab = noop,
  onCloseTab,
  onCloseTabs = noop,
  onReopenTab,
  onPinTab,
  onReorderTab,
  onSplitTab,
  onOpenTab = noop,
  onOpenBrowser = noop,
  onAutoCloseChange = noop,
  className,
  ...props
}: TabStripProps) {
  // The chat tab is the header's, never the strip's: Capy's summary pane is
  // named by the same id, and its button sits in the chat column's header.
  const shown = tabs.filter((tab) => tab.kind !== "chat");
  const ids = shown.map(tabKey);
  const scroller = useOverflowFades(ids.join(","));
  const [menuTarget, setMenuTarget] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const railTabs: RailTab[] = [
    ...(chatTab === undefined ? [] : [{ id: CHAT_TAB_ID, tab: undefined }]),
    ...shown.map((tab) => ({ id: tabKey(tab), tab })),
  ];
  const options: ThreadOptionsProps = {
    ...menu,
    openIds: new Set(ids),
    onOpen: onOpenTab,
    onOpenBrowser,
  };
  const labelOf = (tab: PaneTab) => labelFor?.(tab) ?? tabLabel(tab);
  const dragged = shown.find((tab) => tabKey(tab) === draggingId);

  const closableKeys = ids.join("|");
  const orderKeys = railTabs.map((tab) => tab.id).join("|");

  // The strip prints Capy's bindings beside its menu items, so the strip is
  // what binds them: a shortcut that only ever appears as a label is a dead
  // control, and the label cannot drift from the handler this way.
  useEffect(() => {
    const closable = new Set(
      closableKeys === "" ? [] : closableKeys.split("|"),
    );
    const order = orderKeys === "" ? [] : orderKeys.split("|");
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable='true']") !==
          null
      ) {
        return;
      }
      const select = (id: string) => {
        if (id === CHAT_TAB_ID) chatTab?.onSelect();
        else onSelectTab(id);
      };
      const step = (direction: 1 | -1) => {
        if (order.length < 2) return;
        const current = order.indexOf(activeId ?? CHAT_TAB_ID);
        const next = order[(current + direction + order.length) % order.length];
        if (next === undefined) return;
        event.preventDefault();
        select(next);
      };
      if (matchesShortcut(SHORTCUTS["tab.close"], event)) {
        const closing = closeShortcutTarget ?? activeId ?? null;
        if (closing === null || !closable.has(closing)) return;
        if (onCloseTab === undefined) return;
        event.preventDefault();
        onCloseTab(closing);
        return;
      }
      if (matchesShortcut(SHORTCUTS["tab.reopen"], event)) {
        if (onReopenTab === undefined) return;
        event.preventDefault();
        onReopenTab();
        return;
      }
      if (matchesShortcut(SHORTCUTS["paneTab.previous"], event)) {
        step(-1);
        return;
      }
      if (matchesShortcut(SHORTCUTS["paneTab.next"], event)) {
        step(1);
        return;
      }
      if (matchesShortcut(SHORTCUTS["browser.open"], event)) {
        event.preventDefault();
        onOpenBrowser();
        return;
      }
      const newSideThread = menu?.onNewSideThread;
      if (
        newSideThread !== undefined &&
        matchesShortcut(SHORTCUTS["sideThread.new"], event)
      ) {
        event.preventDefault();
        newSideThread();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    activeId,
    chatTab,
    closeShortcutTarget,
    closableKeys,
    menu,
    onCloseTab,
    onOpenBrowser,
    onReopenTab,
    onSelectTab,
    orderKeys,
  ]);

  const tabButtonProps = (tab: PaneTab) => ({
    tab,
    label: labelOf(tab),
    icon: iconFor?.(tab) ?? tabIcon(tab),
    hover: previewFor?.(tab),
    signals: signalsFor?.(tab),
    active: activeId === tabKey(tab),
    transient: transientIds.includes(tabKey(tab)),
    closeShortcutTarget,
    onSelect: onSelectTab,
    onClose: onCloseTab,
    onPin: onPinTab,
  });

  const onDragStart = (event: DragStartEvent) =>
    setDraggingId(String(event.active.id));
  const onDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    if (event.over === null) return;
    const id = String(event.active.id);
    const before = reorderBefore(ids, id, String(event.over.id));
    if (before !== null) onReorderTab?.(id, before);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-track-owner="features/thread/pane/tab-strip.tsx#PaneTabStrip:ContextMenuTrigger.1"
        render={
          <div
            data-type-focus-exclude=""
            className={[
              "@container flex min-w-0 flex-1 items-center gap-0.5",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        }
        onContextMenu={(event) => {
          const target = event.target;
          if (
            !(target instanceof Element) ||
            !event.currentTarget.contains(target)
          ) {
            event.preventBaseUIHandler();
            return;
          }
          setMenuTarget(
            target.closest<HTMLElement>("[data-pane-tab]")?.dataset.paneTab ??
              null,
          );
        }}
        onKeyDown={openContextMenuFromKeyboard}
      >
        <div
          ref={scroller}
          className="pane-tab-scroller scrollbar-hide isolate flex min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden md:flex-initial"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragCancel={() => setDraggingId(null)}
            onDragEnd={onDragEnd}
          >
            <div className="flex shrink-0 items-center gap-0.5 rounded-(--radius) transition-colors duration-base ease-out-quint">
              {chatTab !== undefined && (
                <ChatTab
                  active={activeId === CHAT_TAB_ID}
                  title={chatTab.title}
                  content={chatTab.content}
                  preview={chatTab.preview}
                  onSelect={chatTab.onSelect}
                />
              )}
              <SortableContext
                items={ids}
                strategy={horizontalListSortingStrategy}
              >
                {shown.map((tab) => (
                  <SortableTab key={tabKey(tab)} {...tabButtonProps(tab)} />
                ))}
              </SortableContext>
            </div>
            <DragOverlay dropAnimation={null}>
              {dragged !== undefined && (
                <div className="w-fit rounded-(--radius) bg-panel shadow-overlay">
                  <PaneTabButton
                    {...tabButtonProps(dragged)}
                    dragging
                    onSelect={noop}
                    onClose={undefined}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
        <div className="flex shrink-0 items-center">
          <PlusMenu options={options} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={menuTarget === null ? "w-64" : "w-80"}>
        <ResponsiveMenuLevel data-menu-list="">
          <RailMenuItems
            target={menuTarget}
            current={menuTarget !== null && menuTarget === closeShortcutTarget}
            railTabs={railTabs}
            activeId={activeId}
            threadId={threadId}
            autoClose={autoClose}
            onAutoCloseChange={onAutoCloseChange}
            onSelect={(id) =>
              id === CHAT_TAB_ID ? chatTab?.onSelect() : onSelectTab(id)
            }
            onClose={(id) => onCloseTab?.(id)}
            onCloseMany={onCloseTabs}
            onReopen={onReopenTab}
            onSplit={onSplitTab}
          />
          {menuTarget !== null && (
            <>
              <MenuSeparator />
              <ThreadOptions {...options} />
            </>
          )}
        </ResponsiveMenuLevel>
      </ContextMenuContent>
    </ContextMenu>
  );
}
