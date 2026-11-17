export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const hairlineBorder = "border-hairline border-transparent";

const buttonBase = cx(
  "cursor-pointer relative inline-flex items-center justify-center w-fit shrink-0 whitespace-nowrap rounded [text-box-trim:trim-both] text-nowrap",
  hairlineBorder,
  "font-medium",
  "transition-colors duration-hover outline-none select-none",
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  "data-[selected]:bg-secondary data-[selected]:text-foreground",
  "group/button",
);

const ghost =
  "bg-transparent text-[var(--intent-text,var(--muted-foreground-1))] hover:text-[var(--intent-text-hover,var(--fg))] hover:bg-[var(--intent-bg-hover,var(--secondary))] data-[popup-open]:text-[var(--intent-text-hover,var(--fg))] active:brightness-97 data-[selected]:data-[unfocused]:bg-secondary/50 data-[selected]:data-[unfocused]:text-muted-foreground-1 data-[selected]:data-[unfocused]:hover:bg-secondary data-[selected]:data-[unfocused]:hover:text-foreground";

const bare =
  "bg-transparent text-[var(--intent-text,var(--muted-foreground-1))] hover:text-[var(--intent-text-hover,var(--fg))] data-[popup-open]:text-[var(--intent-text-hover,var(--fg))] data-[selected]:bg-transparent data-[selected]:text-[var(--intent-text-hover,var(--fg))] active:brightness-97 disabled:opacity-40";

const segmented =
  "bg-transparent text-[var(--intent-text,var(--segmented-foreground))] hover:text-[var(--intent-text-hover,var(--fg))] active:brightness-97 data-[selected]:bg-[var(--intent-bg,var(--card))] data-[selected]:text-[var(--intent-text-hover,var(--fg))] data-[selected]:shadow-card";

const iconSm =
  "size-(--h-control-sm) [&_svg:not([class*='size-'])]:size-(--icon-sm)";

const svgEdges = "[&_svg:first-of-type]:-ml-0.5 [&_svg:last-of-type]:-mr-0.5";

export const ghostIconSmButton = cx(buttonBase, ghost, iconSm);

export const bareIconSmButton = cx(buttonBase, bare, iconSm);

export const barLinkButton = cx(buttonBase, ghost, iconSm, "text-xs", svgEdges);

export const segmentedXsButton = cx(
  buttonBase,
  segmented,
  "h-(--h-control-xs) text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-(--icon-xs)",
  svgEdges,
  "w-6.5 px-0",
);

export const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const menuCheckIcon =
  "ml-auto size-(--icon-sm) shrink-0 text-foreground";
