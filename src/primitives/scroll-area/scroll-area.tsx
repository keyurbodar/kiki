import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import "./scroll-area.css";

const NARROW_QUERY = "(width < 48rem)";

const subscribeNarrow = (onChange: () => void) => {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const narrowSnapshot = () =>
  typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches;

/**
 * True below the md breakpoint, where Capy drops Base UI's custom scrollbar and
 * scrolls natively: touch scrolling needs the platform's own rubber-banding and
 * momentum, and Base UI's hairline thumb is not reachable with a finger.
 */
function useNarrowViewport(): boolean {
  return useSyncExternalStore(subscribeNarrow, narrowSnapshot, () => false);
}

const setRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
  if (typeof ref === "function") ref(node);
  else if (ref !== null && ref !== undefined)
    (ref as { current: T | null }).current = node;
};

/**
 * Set by ScrollArea around the children it already put inside its viewport, on
 * both branches. Base UI's scroll area parts need a Root above them, so a
 * viewport a screen nests inside ScrollArea renders as a plain element instead
 * of a second scroll container — one scroll area owns exactly one viewport.
 */
const NestedViewport = createContext(false);

const viewportBase =
  "size-full overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export type ScrollAreaProps = Omit<
  ComponentProps<typeof BaseScrollArea.Root>,
  "className" | "children"
> & {
  className?: string;
  viewportClassName?: string;
  fadeY?: boolean;
  retainScroll?: boolean;
  scrollRestorationId?: string;
  onViewport?: Ref<HTMLDivElement>;
  children?: ReactNode;
};

export function ScrollArea({
  className,
  viewportClassName,
  fadeY = false,
  retainScroll = false,
  scrollRestorationId,
  onViewport,
  children,
  ...props
}: ScrollAreaProps) {
  const narrow = useNarrowViewport();
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement | null>(null);

  const bindViewport = useCallback(
    (node: HTMLDivElement | null) => {
      viewport.current = node;
      setRef(onViewport, node);
    },
    [onViewport],
  );

  useEffect(() => {
    if (!narrow) return;
    const rootNode = root.current;
    const viewportNode = viewport.current;
    if (rootNode === null || viewportNode === null) return;
    let frame = 0;
    let scrollable: boolean | null = null;
    let start: boolean | null = null;
    let end: boolean | null = null;
    const measure = () => {
      frame = 0;
      const max = viewportNode.scrollHeight - viewportNode.clientHeight;
      const overflows = max > 1;
      if (overflows !== scrollable) {
        if (overflows) viewportNode.setAttribute("tabindex", "0");
        else viewportNode.removeAttribute("tabindex");
        scrollable = overflows;
      }
      if (!fadeY) return;
      const atStart = viewportNode.scrollTop <= 1;
      const atEnd = max - viewportNode.scrollTop <= 1;
      if (atStart !== start) {
        rootNode.toggleAttribute("data-scroll-start", atStart);
        start = atStart;
      }
      if (atEnd !== end) {
        rootNode.toggleAttribute("data-scroll-end", atEnd);
        end = atEnd;
      }
      if (!rootNode.hasAttribute("data-scroll-ready"))
        rootNode.setAttribute("data-scroll-ready", "");
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(viewportNode);
    const observeChildren = () => {
      for (const child of viewportNode.children) resize.observe(child);
    };
    observeChildren();
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const removed of record.removedNodes)
          if (removed instanceof Element) resize.unobserve(removed);
      observeChildren();
      schedule();
    });
    mutations.observe(viewportNode, { childList: true });
    if (fadeY)
      viewportNode.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      viewportNode.removeEventListener("scroll", schedule);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [narrow, fadeY]);

  const caps = fadeY ? (
    <>
      <div aria-hidden className="scroll-fade-cap-t" />
      <div aria-hidden className="scroll-fade-cap-b" />
    </>
  ) : null;

  if (narrow)
    return (
      <NestedViewport.Provider value>
        <div
          ref={root}
          data-slot="scroll-area"
          data-scroll-restoration-ignore={retainScroll ? "" : undefined}
          className={cx("relative min-h-0", className)}
        >
          <div
            ref={bindViewport}
            data-slot="scroll-area-viewport"
            data-scroll-restoration-id={scrollRestorationId}
            className={cx(viewportBase, "overflow-auto", viewportClassName)}
          >
            {children}
          </div>
          {caps}
        </div>
      </NestedViewport.Provider>
    );

  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      data-scroll-restoration-ignore={retainScroll ? "" : undefined}
      className={cx("relative min-h-0", className)}
      {...props}
    >
      <ScrollAreaViewport
        ref={bindViewport}
        data-scroll-restoration-id={scrollRestorationId}
        className={viewportClassName}
      >
        <NestedViewport.Provider value>{children}</NestedViewport.Provider>
      </ScrollAreaViewport>
      {caps}
      <ScrollAreaScrollbar>
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
    </BaseScrollArea.Root>
  );
}

export type ScrollAreaViewportProps = Omit<
  ComponentProps<typeof BaseScrollArea.Viewport>,
  "className"
> & { className?: string };

export function ScrollAreaViewport({
  className,
  ...props
}: ScrollAreaViewportProps) {
  const nested = useContext(NestedViewport);
  if (nested)
    return (
      <div
        className={cx(viewportBase, className)}
        {...(props as ComponentProps<"div">)}
      />
    );
  return (
    <BaseScrollArea.Viewport
      data-slot="scroll-area-viewport"
      tabIndex={-1}
      className={cx(viewportBase, className)}
      {...props}
    />
  );
}

export type ScrollAreaScrollbarProps = Omit<
  ComponentProps<typeof BaseScrollArea.Scrollbar>,
  "className"
> & { className?: string };

export function ScrollAreaScrollbar({
  className,
  orientation = "vertical",
  style,
  ...props
}: ScrollAreaScrollbarProps) {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cx(
        "absolute inset-y-0 z-(--z-top-bar) flex w-1.5 justify-center opacity-0 transition-opacity duration-fast",
        "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        className,
      )}
      style={{ insetInlineEnd: "var(--scroll-area-inset, 0)", ...style }}
      {...props}
    />
  );
}

export type ScrollAreaThumbProps = Omit<
  ComponentProps<typeof BaseScrollArea.Thumb>,
  "className"
> & { className?: string };

export function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps) {
  return (
    <BaseScrollArea.Thumb
      data-slot="scroll-area-thumb"
      className={cx("w-full rounded-full bg-muted-foreground-3/50", className)}
      {...props}
    />
  );
}
