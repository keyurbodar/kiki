/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: the scrollable preview body takes focus so the keyboard can scroll it, as in Capy */
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cx } from "class-variance-authority";
import { useRef } from "react";
import { Button } from "@/primitives/button";
import { Popover, popoverContentVariants } from "@/primitives/popover";
import { copyCell } from "./copy-cell";
import { formatCellPreview, PREVIEW_LIMIT } from "./format";
import { ClipboardGlyph } from "./glyphs";

export type CsvCellTarget = {
  anchor: HTMLElement;
  column: string;
  row: number;
  value: string;
};

export type CsvCellPreviewProps = {
  target: CsvCellTarget | undefined;
  open: boolean;
  onClose: () => void;
};

export function CsvCellPreview({ target, open, onClose }: CsvCellPreviewProps) {
  const body = useRef<HTMLDivElement>(null);
  const preview =
    target === undefined ? undefined : formatCellPreview(target.value);
  return (
    <Popover
      open={open && target !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {target !== undefined && preview !== undefined && (
        <BasePopover.Portal>
          <BasePopover.Positioner
            className="z-(--z-overlay-content) outline-none"
            anchor={target.anchor}
            align="start"
            sideOffset={4}
            collisionPadding={12}
            collisionAvoidance={{ fallbackAxisSide: "start" }}
          >
            <BasePopover.Popup
              data-slot="popover-content"
              initialFocus={body}
              finalFocus={(type) =>
                type === "keyboard" && target.anchor.isConnected
                  ? target.anchor
                  : false
              }
              className={popoverContentVariants({
                className:
                  "w-max max-w-[min(36rem,calc(100vw-(--spacing(6))))] min-w-64 gap-1",
              })}
            >
              <div className="flex shrink-0 items-center gap-2 pl-2">
                <span className="min-w-0 truncate text-xs font-medium">
                  {target.column || "Unnamed column"}
                </span>
                <span className="shrink-0 text-2xs text-muted-foreground-2 tabular-nums">
                  Row {target.row.toLocaleString()}
                </span>
                <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground-3 tabular-nums">
                  {preview.json ? "JSON, " : ""}
                  {preview.cut
                    ? `First ${PREVIEW_LIMIT.toLocaleString()} of `
                    : ""}
                  {target.value.length.toLocaleString()}{" "}
                  {target.value.length === 1 ? "character" : "characters"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy cell"
                  onClick={() => void copyCell(target.value)}
                >
                  <ClipboardGlyph className="size-(--icon-xs)" />
                </Button>
              </div>
              {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: Capy labels the focusable preview body */}
              <div
                ref={body}
                tabIndex={0}
                aria-label={`${target.column} row ${target.row}`}
                className="min-h-0 overflow-auto rounded-md bg-card px-2 py-1.5 outline-none focus-visible:outline-ring-inset"
              >
                <pre
                  className={cx(
                    "text-xs leading-5 break-words whitespace-pre-wrap text-foreground",
                    preview.json ? "font-mono" : "font-sans",
                  )}
                >
                  {preview.text}
                </pre>
              </div>
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      )}
    </Popover>
  );
}
