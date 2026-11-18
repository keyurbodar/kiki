import {
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";

const cx = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const DRAG_TOLERANCE = 6;
const INTERACTIVE =
  "a,button,input,textarea,select,[role='button'],[role='link'],[data-slot='preview-card-trigger']";
const FADE_MASK =
  "[--clamp-fade:var(--clamp-fade-rest)] group-hover/clamp:[--clamp-fade:var(--clamp-fade-hover)] [mask-image:linear-gradient(to_bottom,black_calc(100%-var(--clamp-fade)),transparent)]";

export type ClampFade = { rest: string; hover: string };
const DEFAULT_FADE: ClampFade = { rest: "3.5rem", hover: "5rem" };

export type ClampedBodyProps = {
  /** Collapsed height in px, or a number of lines of the first text block. */
  maxHeight: number | { lines: number };
  expanded: boolean;
  onToggle: () => void;
  fade?: ClampFade;
  /** Renders the toggle in view, as Capy's message body does; auxiliary rows keep it for keyboard only. */
  showToggle?: boolean;
  className?: string;
  children: ReactNode;
};

const hasAnimations = (el: HTMLElement) =>
  typeof el.getAnimations === "function" && el.getAnimations().length > 0;

function useHeightTransition(
  outer: RefObject<HTMLDivElement | null>,
  inner: RefObject<HTMLDivElement | null>,
  expanded: boolean,
  open: boolean,
  limit: RefObject<number>,
  revision: unknown,
) {
  const last = useRef(expanded);
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision re-runs the clamp when maxHeight changes
  useLayoutEffect(() => {
    const el = outer.current;
    const content = inner.current;
    if (el === null || content === null) return;
    const settle = () => {
      el.style.height = "";
      el.style.maxHeight = open ? "" : `${limit.current}px`;
    };
    if (last.current === expanded) {
      settle();
      return;
    }
    last.current = expanded;
    const from = el.getBoundingClientRect().height;
    el.style.maxHeight = "none";
    el.style.height = `${from}px`;
    el.getBoundingClientRect();
    const full = content.getBoundingClientRect().height;
    el.style.height = `${expanded ? full : Math.min(limit.current, full)}px`;
    if (!hasAnimations(el)) {
      settle();
      return;
    }
    let cancelled = false;
    Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => {
      if (!cancelled) settle();
    });
    return () => {
      cancelled = true;
    };
  }, [expanded, open, revision]);
}

/**
 * A body that clamps to a height with a bottom fade and expands on click.
 * A click that ends a text selection or a drag, or lands on a link or
 * button inside, never toggles it.
 */
export function ClampedBody({
  maxHeight,
  fade = DEFAULT_FADE,
  showToggle = false,
  expanded,
  onToggle,
  className,
  children,
}: ClampedBodyProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; selected: boolean } | null>(
    null,
  );
  const toggledByClick = useRef(false);
  const [overflows, setOverflows] = useState(true);
  const open = expanded || !overflows;
  const lines = typeof maxHeight === "number" ? undefined : maxHeight.lines;
  const limit = useRef(typeof maxHeight === "number" ? maxHeight : 0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: maxHeight is the only input
  useLayoutEffect(() => {
    const content = inner.current;
    if (content === null) return;
    const measure = () => {
      if (typeof maxHeight === "number") {
        limit.current = maxHeight;
      } else {
        const block =
          content.querySelector<HTMLElement>(
            "p, li, pre, h1, h2, h3, h4, h5, h6",
          ) ?? content;
        limit.current =
          maxHeight.lines *
          Number.parseFloat(getComputedStyle(block).lineHeight);
      }
      setOverflows(content.getBoundingClientRect().height > limit.current + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [lines, typeof maxHeight === "number" ? maxHeight : undefined]);

  useHeightTransition(outer, inner, expanded, open, limit, maxHeight);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: click-to-expand is a pointer shortcut; keyboard users get the Show more button below
    // biome-ignore lint/a11y/useKeyWithClickEvents: same as above
    <div
      className={cx("group/clamp", className, overflows && "cursor-pointer")}
      onPointerDown={(event) => {
        const selection = window.getSelection();
        press.current = {
          x: event.clientX,
          y: event.clientY,
          selected:
            outer.current !== null &&
            selection !== null &&
            !selection.isCollapsed &&
            selection.containsNode(outer.current, true),
        };
      }}
      onClick={(event) => {
        const start = press.current;
        press.current = null;
        if (!overflows || event.detail !== 1) return;
        toggledByClick.current = false;
        if (start?.selected) return;
        if (
          start !== null &&
          Math.abs(event.clientX - start.x) +
            Math.abs(event.clientY - start.y) >
            DRAG_TOLERANCE
        ) {
          return;
        }
        if (
          event.target instanceof Element &&
          event.target.closest(INTERACTIVE)
        ) {
          return;
        }
        const selection = window.getSelection();
        if (selection === null || selection.isCollapsed) {
          toggledByClick.current = true;
          onToggle();
        }
      }}
      onDoubleClick={() => {
        if (!toggledByClick.current) return;
        toggledByClick.current = false;
        onToggle();
      }}
    >
      <div
        ref={outer}
        data-slot="clamped-body"
        style={
          {
            "--clamp-fade-rest": fade.rest,
            "--clamp-fade-hover": fade.hover,
          } as React.CSSProperties
        }
        className={cx(
          "overflow-hidden transition-[height,--clamp-fade] duration-exit ease-out-quint",
          !open && FADE_MASK,
        )}
      >
        <div ref={inner}>{children}</div>
      </div>
      {overflows && (
        <span
          className={showToggle ? "block" : "sr-only focus-within:not-sr-only"}
        >
          <Button
            variant="ghost"
            size="xs"
            aria-expanded={expanded}
            aria-label={expanded ? "Show less" : "Show more"}
            onClick={onToggle}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        </span>
      )}
    </div>
  );
}
