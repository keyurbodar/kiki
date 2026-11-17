import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export const selectionToolbarHeight = 38;
export const selectionToolbarGap = 6;
export const selectionToolbarInset = 8;

export type DiffSelection = {
  text: string;
  rect: { top: number; height: number };
  focus: { x: number };
};

export type DiffSelectionAction = {
  label: string;
  run: () => void;
};

export type DiffSelectionToolbarProps = {
  selection: DiffSelection;
  onComment?: () => void;
  commentAction?: DiffSelectionAction;
  onCopy?: () => void;
  copy?: DiffSelectionAction;
  actions?: ReactNode;
  actionsWidth?: number;
  side?: "above" | "below";
  align?: "center" | "start" | "end";
  bottom?: number;
  container?: Element;
  ref?: Ref<HTMLDivElement>;
};

const copyFailed = () => toast.error("Could not copy");

/** The toolbar portals into the document, so it renders only after mount. */
const useIsClient = () =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

/**
 * Where the floating toolbar sits: prefer the requested side of the selection,
 * flip when it would clip, and keep the whole bar inside the viewport.
 */
export function selectionToolbarPosition({
  selection,
  actionsWidth = 30,
  side = "above",
  align = "center",
  bottom,
  viewportWidth,
  viewportHeight,
}: Pick<
  DiffSelectionToolbarProps,
  "selection" | "actionsWidth" | "side" | "align" | "bottom"
> & {
  viewportWidth: number;
  viewportHeight: number;
}) {
  const width = 72 + (actionsWidth === undefined ? 0 : actionsWidth);
  const above =
    selection.rect.top - selectionToolbarGap - selectionToolbarHeight;
  const below =
    selection.rect.top + selection.rect.height + selectionToolbarGap;
  const limit =
    Math.min(bottom ?? viewportHeight, viewportHeight) -
    selectionToolbarInset -
    selectionToolbarHeight;
  const top = Math.min(
    Math.max(
      selectionToolbarInset,
      side === "below"
        ? below <= limit
          ? below
          : above
        : above >= selectionToolbarInset
          ? above
          : below,
    ),
    limit,
  );
  const center = selection.focus.x - width / 2;
  const horizontal =
    align === "start"
      ? { left: selection.focus.x }
      : align === "end"
        ? {
            right: Math.max(
              selectionToolbarInset,
              Math.min(
                viewportWidth - selection.focus.x,
                viewportWidth - width - selectionToolbarInset,
              ),
            ),
          }
        : {
            left: Math.min(
              Math.max(selectionToolbarInset, center),
              viewportWidth - width - selectionToolbarInset,
            ),
          };
  return { top, ...horizontal };
}

export function DiffSelectionToolbar({
  selection,
  onComment,
  commentAction,
  onCopy,
  copy,
  actions,
  actionsWidth = 30,
  side = "above",
  align = "center",
  bottom,
  container,
  ref,
}: DiffSelectionToolbarProps) {
  const copySelection = () => {
    navigator.clipboard
      .writeText(selection.text)
      .then(() => toast.success("Copied"), copyFailed);
    onCopy?.();
  };
  const label = copy?.label ?? "Copy";
  const runCopy = copy?.run ?? copySelection;
  const isClient = useIsClient();
  const [position, setPosition] = useState<CSSProperties>();
  useLayoutEffect(() => {
    setPosition(
      selectionToolbarPosition({
        selection,
        actionsWidth,
        side,
        align,
        bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
    );
  }, [selection, actionsWidth, side, align, bottom]);
  const comment = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Comment"
      onClick={onComment}
    >
      <Icon name="bubble-text" />
    </Button>
  );
  const commentButton =
    commentAction === undefined ? (
      comment
    ) : (
      <>
        <span
          title={
            position !== undefined && position.top < selection.rect.top
              ? "top"
              : "bottom"
          }
        >
          {comment}
        </span>
        <span className="sr-only">{commentAction.label}</span>
      </>
    );
  const bar = (
    <div
      ref={ref}
      data-slot="selection-toolbar"
      className="fixed z-(--z-overlay-content) flex items-center gap-0.5 rounded-(--radius-overlay) border-hairline border-border-2 bg-popover p-1 shadow-overlay"
      style={position ?? { visibility: "hidden" }}
      onPointerUp={(event) => event.stopPropagation()}
    >
      {commentButton}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        onClick={runCopy}
      >
        <Icon name="clipboard" />
      </Button>
      {actions}
    </div>
  );
  return isClient ? createPortal(bar, container ?? document.body) : null;
}
