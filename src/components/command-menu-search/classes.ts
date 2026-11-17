import { cva } from "class-variance-authority";

export const paletteOverlayClass =
  "fixed inset-0 z-(--z-dialog) bg-overlay transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast";

export const palettePositionerClass =
  "fixed inset-0 z-(--z-dialog) flex h-dvh flex-col items-center px-4 pt-[15dvh] pb-[calc(1rem+var(--safe-bottom))]";

export const paletteContentClass =
  "relative flex max-h-full w-full max-w-180 min-h-0 flex-col overflow-hidden rounded-(--radius-panel) border-hairline border-border-2 bg-popover shadow-overlay outline-none transition-[opacity,scale] duration-base ease-out-quint data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast";

export const paletteBodyClass = "flex min-h-0 flex-col";

export const paletteInputRowClass = "flex shrink-0 items-center";

export const paletteInputClass =
  "h-11 w-full min-w-0 flex-1 shrink-0 bg-transparent px-4 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const paletteInputTrailingClass = "flex shrink-0 items-center pr-2";

export const paletteSeparatorClass = "mx-0 my-0 h-px shrink-0 bg-border-1";

export const paletteListClass =
  "max-h-[min(25rem,60vh)] min-h-0 flex-1 overflow-y-auto p-1.5 scroll-py-1.5";

export const paletteEmptyClass =
  "hidden px-2 py-10 text-center text-sm text-muted-foreground-2 only:block";

export const paletteGroupClass = "flex flex-col gap-px";

export const paletteGroupLabelClass =
  "flex min-h-7 items-center px-2.5 text-xs font-medium text-muted-foreground-2";

export const paletteFooterClass =
  "flex h-10 shrink-0 items-center gap-4 border-t-hairline border-border-1 px-4";

export const paletteHintClass =
  "flex items-center gap-1.5 text-xs font-normal text-muted-foreground-2";

export const paletteKeysClass = "flex items-center gap-0.5";

export const paletteKbdClass =
  "pointer-events-none inline-flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-(--radius-kbd) bg-secondary px-1 font-sans text-xs font-normal text-muted-foreground-1 select-none";

export const paletteFiltersClass =
  "flex shrink-0 items-center gap-0.5 overflow-x-auto px-1.5 pt-1.5 [scrollbar-width:none]";

export const paletteFilterClass =
  "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center rounded px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-2 outline-none select-none transition-colors duration-100 hover:text-foreground aria-selected:bg-secondary aria-selected:text-foreground";

export const paletteItemVariants = cva(
  [
    "relative flex w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal outline-none select-none",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
    "h-(--h-palette-row) gap-2.5 rounded-(--radius-overlay) px-2.5 [&_svg:not([class*='size-'])]:size-(--icon-base)",
    "data-[highlighted]:bg-[var(--menu-row-highlight,var(--popover-hover))] data-[popup-open]:bg-[var(--menu-row-highlight,var(--popover-hover))]",
  ],
  {
    variants: {
      intent: {
        neutral: "text-foreground",
        danger:
          "text-destructive [--menu-row-highlight:var(--destructive-soft)]",
      },
    },
    defaultVariants: { intent: "neutral" },
  },
);

export const paletteItemIconClass =
  "flex size-(--icon-base) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const paletteItemTrailingClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground-2";

export const paletteGhostButtonClass =
  "relative inline-flex w-fit shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded border-hairline border-transparent bg-transparent px-2.5 text-xs font-medium text-[var(--intent-text,var(--muted-foreground-1))] outline-none transition-colors duration-hover select-none hover:bg-[var(--intent-bg-hover,var(--secondary))] hover:text-[var(--intent-text-hover,var(--fg))] active:brightness-97 h-(--h-control-sm) md:px-2 [&_svg:not([class*='size-'])]:size-(--icon-sm)";

export const paletteStatusLineClass =
  "flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-normal text-muted-foreground-1";
