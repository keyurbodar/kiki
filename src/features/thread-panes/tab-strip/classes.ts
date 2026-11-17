/** Capy's menu row part classes, as its tab-strip menus apply them. */
export const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const menuText =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

export const menuTrailing =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export const menuCheck = "size-(--icon-sm) shrink-0 text-foreground";

export const menuChevron = "size-(--icon-sm) shrink-0 text-muted-foreground-3";

export const menuLabel =
  "mt-1 flex min-h-[calc(var(--spacing)*5.5)] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

export const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const menuEmpty =
  "px-2 py-3 text-center text-sm font-normal text-muted-foreground-2";

export const statusDot = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
} as const;

export type StatusColor = keyof typeof statusDot;
