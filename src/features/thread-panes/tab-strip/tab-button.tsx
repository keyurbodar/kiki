import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { Button } from "@/primitives/button";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CrossGlyph } from "./glyphs";
import { shortcutFor } from "./shortcut";
import { isFileTab, isThreadLikeTab, type PaneTab, tabKey } from "./tabs";

const coarseQuery = "(pointer: coarse)";

const subscribeCoarse = (onChange: () => void) => {
  if (typeof window === "undefined" || window.matchMedia === undefined) {
    return () => {};
  }
  const media = window.matchMedia(coarseQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const readCoarse = () =>
  typeof window !== "undefined" &&
  window.matchMedia !== undefined &&
  window.matchMedia(coarseQuery).matches;

/** True on touch-first devices, where close buttons stay visible. */
export const useCoarsePointer = () =>
  useSyncExternalStore(subscribeCoarse, readCoarse, () => false);

/** Per-tab state the strip shows next to the label. */
export type TabSignals = {
  unread?: boolean;
  asked?: boolean;
  dirty?: boolean;
  status?: ReactNode;
};

export type TabHoverProps = {
  title: string;
  preview?: ReactNode;
  className?: string;
  disabled?: boolean;
  children: ReactElement;
};

/** Capy's hover card under a tab: a custom preview, or the full title. */
export function TabHover({
  title,
  preview,
  className,
  disabled,
  children,
}: TabHoverProps) {
  return (
    <PreviewCard>
      <PreviewCardTrigger
        data-track-owner="features/thread/pane/tab-strip.tsx#TabHover:PreviewCardTrigger.1"
        render={children}
      />
      {!disabled && (
        <PreviewCardContent side="bottom" sideOffset={4} className={className}>
          {preview ?? (
            <span className="text-sm font-medium text-foreground">{title}</span>
          )}
        </PreviewCardContent>
      )}
    </PreviewCard>
  );
}

export type PaneTabButtonProps = {
  tab: PaneTab;
  label: string;
  icon?: ReactNode;
  hover?: ReactNode;
  signals?: TabSignals;
  active: boolean;
  transient?: boolean;
  dragging?: boolean;
  closeShortcutTarget?: string;
  onSelect: (id: string) => void;
  onClose?: (id: string) => void;
  onPin?: (id: string) => void;
};

/** One tab: select on click, pin on double click, close on middle click. */
export function PaneTabButton({
  tab,
  label,
  icon,
  hover,
  signals,
  active,
  transient = false,
  dragging = false,
  closeShortcutTarget,
  onSelect,
  onClose,
  onPin,
}: PaneTabButtonProps) {
  const id = tabKey(tab);
  const coarse = useCoarsePointer();
  const closable = onClose !== undefined;
  const threadLike = isThreadLikeTab(tab);
  const file = isFileTab(tab);
  const highlighted = signals?.unread === true;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView?.({ inline: "nearest", block: "nearest" });
    }
  }, [active]);

  const button = (
    <Button
      data-track-owner="features/thread/pane/tab-strip.tsx#TabButton:Button.1"
      variant="ghost"
      size="sm"
      data-selected={active ? "" : undefined}
      className={[
        "whitespace-nowrap",
        threadLike && "pane-chat-tab min-w-0",
        file && "max-w-42",
        transient && "italic",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() =>
        coarse && transient && active ? onPin?.(id) : onSelect(id)
      }
      onDoubleClick={() => onPin?.(id)}
      onAuxClick={(event) => {
        if (event.button === 1) onClose?.(id);
      }}
    >
      <span
        className={[
          "flex size-(--icon-sm) items-center justify-center empty:hidden",
          (threadLike || file) && "shrink-0",
          highlighted && "text-foreground",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {signals?.status ?? icon}
      </span>
      <span
        data-pane-tab-label={label}
        className={[
          (threadLike || file) && "min-w-0 truncate",
          highlighted && "font-semibold text-foreground",
          !coarse &&
            closable &&
            "group-hover/tab:[--tab-close-start:--spacing(8)] group-hover/tab:[--tab-close-end:--spacing(4)] group-has-[:focus-visible]/tab:[--tab-close-start:--spacing(8)] group-has-[:focus-visible]/tab:[--tab-close-end:--spacing(4)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </span>
      {signals?.asked === true && (
        <span
          role="img"
          aria-label="Waiting on you"
          className="block size-1.5 shrink-0 rounded-full bg-(--primary)"
        />
      )}
      {signals?.dirty === true && (
        <span
          role="img"
          aria-label="Unsaved changes"
          className={[
            "ml-0.5 flex size-(--icon-sm) items-center justify-center",
            closable &&
              !coarse &&
              "transition-opacity duration-hover group-hover/tab:opacity-0 group-has-[:focus-visible]/tab:opacity-0",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="size-1.5 rounded-full bg-current opacity-60" />
        </span>
      )}
      {coarse && closable && (
        <span aria-hidden className={threadLike ? "w-4 shrink-0" : "w-4"} />
      )}
    </Button>
  );

  return (
    <span
      ref={ref}
      data-pane-tab={id}
      className="group/tab relative flex shrink-0"
    >
      {threadLike || file || hover !== undefined ? (
        <TabHover
          title={label}
          preview={hover}
          disabled={dragging}
          className={tab.kind === "issue" ? "w-80" : undefined}
        >
          {button}
        </TabHover>
      ) : (
        button
      )}
      {closable && (
        <span
          className={[
            "absolute top-1/2 right-1 -translate-y-1/2",
            !coarse &&
              "pointer-events-none opacity-0 transition-opacity duration-hover group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 group-has-[:focus-visible]/tab:pointer-events-auto group-has-[:focus-visible]/tab:opacity-100",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Tooltip>
            <TooltipTrigger
              data-track-owner="features/thread/pane/tab-strip.tsx#TabButton:TooltipTrigger.1"
              render={
                <Button
                  data-track-owner="features/thread/pane/tab-strip.tsx#TabButton:Button.2"
                  variant="bare"
                  size="icon-shrink"
                  aria-label={`Close ${label}`}
                  tabIndex={-1}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(id);
                  }}
                  className="size-5 w-5! rounded-(--radius-inner)"
                >
                  <CrossGlyph />
                </Button>
              }
            />
            <TooltipContent side="bottom">
              Close {label}
              {!coarse && closeShortcutTarget === id && (
                <span data-slot="tooltip-shortcut">
                  {shortcutFor("tab.close")}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </span>
      )}
    </span>
  );
}

export type ChatTabProps = {
  active: boolean;
  title: string;
  content: ReactNode;
  preview?: ReactNode;
  dragging?: boolean;
  onSelect: () => void;
};

/** The pinned chat tab that heads the main strip. */
export function ChatTab({
  active,
  title,
  content,
  preview,
  dragging = false,
  onSelect,
}: ChatTabProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView?.({ inline: "nearest", block: "nearest" });
    }
  }, [active]);

  return (
    <span
      ref={ref}
      data-pane-tab="chat"
      className={
        dragging
          ? "relative flex shrink-0 items-center opacity-50"
          : "relative flex shrink-0 items-center"
      }
    >
      <TabHover title={title} preview={preview} disabled={dragging}>
        <Button
          data-track-owner="features/thread/pane/tab-strip.tsx#ChatTab:Button[onClick=onSelect]"
          variant="ghost"
          size="sm"
          data-selected={active ? "" : undefined}
          className="pane-chat-tab min-w-0 whitespace-nowrap"
          onClick={onSelect}
        >
          {content}
        </Button>
      </TabHover>
    </span>
  );
}
