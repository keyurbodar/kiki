/**
 * Class strings from Capy's `shared/view-toolbar` and `ui/responsive-menu`,
 * held here until the shared view toolbar (D4) and menu primitives (A5) land.
 *
 * Capy draws hairlines as `border-[0.5px]`; the raw-value guard rejects px, so
 * the same width is written as a rem fraction (0.5px at the 16px root).
 */
export const hairline = "border-[0.03125rem]";

export const cx = (...parts: ReadonlyArray<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const toolbarButton = cx(
  "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded",
  hairline,
  "border-border-2 bg-button px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-1 shadow-(--sh-plate)",
  "outline-none select-none transition-colors duration-100 hover:bg-button-hover hover:text-foreground",
  "focus-visible:outline-ring-inset",
  "[&_svg]:size-(--icon-sm) [&_svg]:shrink-0",
);

export const viewTabActive =
  "bg-secondary text-foreground shadow-none hover:bg-secondary";

export const menuPopup = cx(
  "rounded-(--radius-overlay)",
  hairline,
  "border-border-2 bg-popover p-1 text-foreground shadow-(--sh-overlay)",
  "flex max-h-[min(60dvh,var(--available-height))] min-w-32 flex-col overflow-hidden",
  "z-(--z-overlay-content) origin-(--transform-origin) outline-none",
);

export const menuList = "-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1";

export const menuRow = cx(
  "relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "data-[highlighted]:bg-popover-hover data-[popup-open]:bg-popover-hover hover:bg-popover-hover",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
);

export const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted [&_svg]:size-(--icon-sm)";

export const menuTrailing =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export const menuCheck = "ml-auto size-(--icon-sm) shrink-0 text-foreground";

export const menuChevron = "size-(--icon-sm) shrink-0 text-muted-foreground-3";

export const menuSeparator = "-mx-1 my-1 h-px shrink-0 bg-border-1";

export const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const chipSegment = cx(
  "flex shrink-0 items-center gap-1 px-1.5 first:border-l-0",
  "border-l-[0.03125rem] border-border-2",
);

export const chipButton = cx(
  chipSegment,
  "h-full cursor-pointer outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset",
);
