/**
 * Capy's menu class strings (ui/menu.tsx). The menu primitives on main are still unstyled stubs,
 * so the issue row's context menu styles its popup, and the rows IssueMenuItems renders, from here
 * until the menu package fills the primitives in.
 */
export const menuPopupClassName = [
  "rounded-(--radius-overlay) border-hairline border-border-2 bg-popover p-1 text-foreground shadow-overlay",
  "flex max-h-[min(60dvh,var(--available-height))] min-w-32 flex-col overflow-hidden",
  "origin-(--transform-origin) outline-none transition-[opacity,scale] duration-fast ease-out-quint data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[instant]:transition-none",
].join(" ");

export const menuListClassName =
  "-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1 md:scroll-fade-y";

/** Capy's menu row, separator and label looks, applied to the menu parts inside a popup. */
export const menuPartsClassName = [
  "**:data-[slot=menu-item]:flex **:data-[slot=menu-item]:w-full **:data-[slot=menu-item]:min-w-0 **:data-[slot=menu-item]:cursor-pointer **:data-[slot=menu-item]:items-center **:data-[slot=menu-item]:gap-2 **:data-[slot=menu-item]:rounded **:data-[slot=menu-item]:px-2 **:data-[slot=menu-item]:text-left **:data-[slot=menu-item]:text-sm **:data-[slot=menu-item]:font-normal **:data-[slot=menu-item]:text-foreground **:data-[slot=menu-item]:outline-none **:data-[slot=menu-item]:select-none **:data-[slot=menu-item]:h-(--h-menu-row) **:data-[slot=menu-item]:data-disabled:pointer-events-none **:data-[slot=menu-item]:data-disabled:opacity-50 **:data-[slot=menu-item]:data-highlighted:bg-[var(--menu-row-highlight,var(--popover-hover))] **:data-[slot=menu-item]:data-popup-open:bg-[var(--menu-row-highlight,var(--popover-hover))]",
  "**:data-[slot=menu-sub-trigger]:flex **:data-[slot=menu-sub-trigger]:w-full **:data-[slot=menu-sub-trigger]:min-w-0 **:data-[slot=menu-sub-trigger]:cursor-pointer **:data-[slot=menu-sub-trigger]:items-center **:data-[slot=menu-sub-trigger]:gap-2 **:data-[slot=menu-sub-trigger]:rounded **:data-[slot=menu-sub-trigger]:px-2 **:data-[slot=menu-sub-trigger]:text-left **:data-[slot=menu-sub-trigger]:text-sm **:data-[slot=menu-sub-trigger]:font-normal **:data-[slot=menu-sub-trigger]:text-foreground **:data-[slot=menu-sub-trigger]:outline-none **:data-[slot=menu-sub-trigger]:select-none **:data-[slot=menu-sub-trigger]:h-(--h-menu-row) **:data-[slot=menu-sub-trigger]:data-disabled:pointer-events-none **:data-[slot=menu-sub-trigger]:data-disabled:opacity-50 **:data-[slot=menu-sub-trigger]:data-highlighted:bg-[var(--menu-row-highlight,var(--popover-hover))] **:data-[slot=menu-sub-trigger]:data-popup-open:bg-[var(--menu-row-highlight,var(--popover-hover))]",
  "**:data-[slot=menu-checkbox-item]:flex **:data-[slot=menu-checkbox-item]:w-full **:data-[slot=menu-checkbox-item]:min-w-0 **:data-[slot=menu-checkbox-item]:cursor-pointer **:data-[slot=menu-checkbox-item]:items-center **:data-[slot=menu-checkbox-item]:gap-2 **:data-[slot=menu-checkbox-item]:rounded **:data-[slot=menu-checkbox-item]:px-2 **:data-[slot=menu-checkbox-item]:text-left **:data-[slot=menu-checkbox-item]:text-sm **:data-[slot=menu-checkbox-item]:font-normal **:data-[slot=menu-checkbox-item]:text-foreground **:data-[slot=menu-checkbox-item]:outline-none **:data-[slot=menu-checkbox-item]:select-none **:data-[slot=menu-checkbox-item]:h-(--h-menu-row) **:data-[slot=menu-checkbox-item]:data-disabled:pointer-events-none **:data-[slot=menu-checkbox-item]:data-disabled:opacity-50 **:data-[slot=menu-checkbox-item]:data-highlighted:bg-[var(--menu-row-highlight,var(--popover-hover))] **:data-[slot=menu-checkbox-item]:data-popup-open:bg-[var(--menu-row-highlight,var(--popover-hover))]",
  "**:data-[slot=menu-separator]:-mx-1 **:data-[slot=menu-separator]:my-1 **:data-[slot=menu-separator]:h-px **:data-[slot=menu-separator]:bg-border-1",
  "**:data-[slot=menu-label]:mt-1 **:data-[slot=menu-label]:flex **:data-[slot=menu-label]:min-h-5.5 **:data-[slot=menu-label]:items-center **:data-[slot=menu-label]:px-2 **:data-[slot=menu-label]:text-xs **:data-[slot=menu-label]:font-medium **:data-[slot=menu-label]:text-muted-foreground-2",
  "**:data-[slot=icon]:not-[[class*='size-']]:size-(--icon-sm)",
].join(" ");

export const menuIconSlotClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
