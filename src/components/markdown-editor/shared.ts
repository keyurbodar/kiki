export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const overlaySurfaceClass =
  "rounded-(--radius-overlay) border-hairline border-border-2 bg-popover p-1 text-foreground shadow-overlay";

export const overlayLayerClass = "z-(--z-overlay-content) outline-none";

export const menuIconSlotClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const menuCheckClass = "size-(--icon-sm) shrink-0 text-foreground";

export const menuValueClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export const menuSearchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const preventMouseDown = (event: { preventDefault: () => void }) =>
  event.preventDefault();

export const refocusEditor = (editor: { focus: () => void }) => {
  requestAnimationFrame(() => requestAnimationFrame(() => editor.focus()));
};

export const readLengthToken = (element: Element, name: string) =>
  Number.parseFloat(getComputedStyle(element).getPropertyValue(name)) || 0;
