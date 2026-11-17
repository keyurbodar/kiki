/**
 * Class strings for parts whose primitives are still contract stubs on main
 * (Button, Switch, Menu, Popover). Each mirrors Capy's own class
 * string for that part, so the dialog renders at parity today; drop each one
 * when its primitive is filled in.
 */
const buttonBase =
  "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded border-hairline border-transparent font-medium transition-colors duration-fast outline-none select-none focus-visible:outline-ring-inset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const ghostIconButton = `${buttonBase} size-(--h-control-sm) bg-transparent text-muted-foreground-1 hover:bg-secondary hover:text-foreground data-[popup-open]:text-foreground [&_svg]:size-(--icon-sm)`;

export const accentButton = `${buttonBase} h-(--h-control-sm) gap-1.5 px-2.5 text-xs border-border-2 bg-primary text-primary-foreground shadow-plate hover:brightness-95 md:px-2`;

export const bareButton = `${buttonBase} h-auto gap-1 bg-transparent text-sm`;

export const switchRoot =
  "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-hairline border-border-2 bg-muted p-switch-inset transition-colors duration-fast outline-none focus-visible:outline-ring-inset data-[checked]:border-transparent data-[checked]:bg-primary data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55 [&>[data-slot=switch-thumb]]:size-3 [&>[data-slot=switch-thumb]]:rounded-full [&>[data-slot=switch-thumb]]:bg-primary-foreground [&>[data-slot=switch-thumb]]:shadow-plate [&>[data-slot=switch-thumb]]:transition-transform [&>[data-slot=switch-thumb]]:duration-fast [&>[data-slot=switch-thumb]]:ease-out-quint [&>[data-slot=switch-thumb][data-checked]]:translate-x-3";

/** Capy's menu surface, plus row styling for the shared option lists. */
export const menuPopup =
  "new-issue-menu relative z-(--z-dialog) flex max-h-[min(60dvh,var(--available-height))] min-w-32 flex-col overflow-hidden rounded-(--radius-overlay) border-hairline border-border-2 bg-popover p-1 text-foreground shadow-overlay origin-(--transform-origin) outline-none transition-[opacity,scale] duration-fast ease-out-quint data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0";

export const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";

export const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

/** Capy's issuePickerTrigger "pill" look. */
export const pillTrigger =
  "inline-flex h-(--h-control-sm) max-w-56 shrink-0 cursor-pointer items-center justify-center gap-1 rounded border-hairline border-border-2 bg-button px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-1 shadow-plate outline-none select-none transition-colors duration-fast hover:bg-button-hover hover:text-foreground focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm) [&_svg]:shrink-0";
