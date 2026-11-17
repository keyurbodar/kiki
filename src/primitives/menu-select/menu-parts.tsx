import { cx } from "class-variance-authority";
import type { SVGProps } from "react";

export const menuPositionerClass = "z-(--z-overlay-content) outline-none";

export const menuPopupClass = cx(
  "rounded-(--radius-overlay) border-hairline border-border-2 bg-popover p-1 text-foreground shadow-overlay",
  "flex max-h-[min(60dvh,var(--available-height))] flex-col overflow-hidden",
  "origin-(--transform-origin) outline-none transition-[opacity,scale] duration-fast ease-out-quint data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:duration-exit data-[instant]:transition-none",
);

export const menuListClass =
  "-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1 md:scroll-fade-y";

export const menuGroupLabelClass =
  "mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

export const menuSearchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const menuItemIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const menuCheckIconClass = "size-(--icon-sm) shrink-0 text-foreground";

export const menuChevronIconClass =
  "size-(--icon-sm) shrink-0 text-muted-foreground-3";

export const menuSeparatorClass = "-mx-1 my-1 h-px bg-border-1";

type ClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined;

export function withClassName<State>(
  base: string,
  className: ClassName<State>,
): ClassName<State> {
  return typeof className === "function"
    ? (state: State) => cx(base, className(state))
    : cx(base, className);
}

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

export function ChevronDownSmallIcon(props: GlyphProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckmarkIcon(props: GlyphProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
