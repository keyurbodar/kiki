import { cx } from "class-variance-authority";
import type { ReactNode, SVGProps } from "react";
import type { PullRefState } from "./pull-ref";

type Glyph = "open" | "draft" | "merged" | "failed" | "closed";

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const glyphs: Record<Glyph, { label: string; shapes: ReactNode }> = {
  open: {
    label: "pull-request",
    shapes: (
      <>
        <circle cx="6" cy="6" r="2" {...stroke} />
        <circle cx="6" cy="18" r="2" {...stroke} />
        <circle cx="18" cy="18" r="2" {...stroke} />
        <path d="M6 8V16" {...stroke} />
        <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
        <path d="M14 4L12 6L14 8" {...stroke} />
      </>
    ),
  },
  draft: {
    label: "draft",
    shapes: (
      <>
        <circle cx="6.5" cy="6" r="2" {...stroke} />
        <circle cx="6.5" cy="18" r="2" {...stroke} />
        <circle cx="17.5" cy="18" r="2" {...stroke} />
        <path d="M6.5 8V16" {...stroke} />
        <path
          d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z"
          {...stroke}
        />
        <path
          d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z"
          {...stroke}
        />
      </>
    ),
  },
  merged: {
    label: "merged",
    shapes: (
      <>
        <circle cx="6" cy="6" r="2" {...stroke} />
        <circle cx="6" cy="18" r="2" {...stroke} />
        <circle cx="18" cy="18" r="2" {...stroke} />
        <path d="M6 8V16" {...stroke} />
        <path d="M8 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
      </>
    ),
  },
  failed: {
    label: "shield-crossed",
    shapes: (
      <path
        d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
        {...stroke}
      />
    ),
  },
  closed: {
    label: "request-closed",
    shapes: (
      <>
        <circle cx="6.5" cy="6" r="2" {...stroke} />
        <circle cx="6.5" cy="18" r="2" {...stroke} />
        <circle cx="17.5" cy="18" r="2" {...stroke} />
        <path d="M6.5 8V16" {...stroke} />
        <path d="M17.5 11V16" {...stroke} />
        <path d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75" {...stroke} />
      </>
    ),
  },
};

export const pullStateIcons: Record<
  PullRefState,
  { glyph: Glyph; className: string }
> = {
  ready: { glyph: "open", className: "text-success" },
  pending: { glyph: "open", className: "text-warning-fg" },
  draft: { glyph: "draft", className: "text-muted-foreground-2" },
  merged: { glyph: "merged", className: "text-complete" },
  failed: { glyph: "failed", className: "text-destructive" },
  closed: { glyph: "closed", className: "text-destructive" },
};

export type PullStateIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  state: PullRefState;
};

export function PullStateIcon({
  state,
  className,
  ...props
}: PullStateIconProps) {
  const { glyph, className: tone } = pullStateIcons[state];
  return (
    <svg
      data-slot="icon"
      data-icon={glyphs[glyph].label}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cx("size-3 shrink-0", tone, className)}
      {...props}
    >
      {glyphs[glyph].shapes}
    </svg>
  );
}
