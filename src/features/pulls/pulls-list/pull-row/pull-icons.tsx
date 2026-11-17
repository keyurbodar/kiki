import type { SVGProps } from "react";
import type { PullState } from "@/features/pulls/pulls-page/data/pull";

/**
 * Central icons Capy's pulls screens use that the shared sprite does not carry
 * yet, drawn from the same paths as Capy's bundle. Move them into the sprite
 * once the icon package adds them.
 */
type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  label,
  children,
  ...props
}: GlyphProps & { label: string; children: React.ReactNode }) {
  return (
    <svg
      data-slot="icon"
      data-icon={label}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PullRequestGlyph(props: GlyphProps) {
  return (
    <Glyph label="pull-request" {...props}>
      <circle cx="6" cy="6" r="2" {...stroke} />
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="18" r="2" {...stroke} />
      <path d="M6 8V16" {...stroke} />
      <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
      <path d="M14 4L12 6L14 8" {...stroke} />
    </Glyph>
  );
}

export function PullDraftGlyph(props: GlyphProps) {
  return (
    <Glyph label="draft" {...props}>
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
    </Glyph>
  );
}

export function PullMergedGlyph(props: GlyphProps) {
  return (
    <Glyph label="merged" {...props}>
      <circle cx="6" cy="6" r="2" {...stroke} />
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="18" r="2" {...stroke} />
      <path d="M6 8V16" {...stroke} />
      <path d="M8 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
    </Glyph>
  );
}

export function PullFailedGlyph(props: GlyphProps) {
  return (
    <Glyph label="shield-crossed" {...props}>
      <path
        d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
        {...stroke}
      />
    </Glyph>
  );
}

export function PullClosedGlyph(props: GlyphProps) {
  return (
    <Glyph label="request-closed" {...props}>
      <circle cx="6.5" cy="6" r="2" {...stroke} />
      <circle cx="6.5" cy="18" r="2" {...stroke} />
      <circle cx="17.5" cy="18" r="2" {...stroke} />
      <path d="M6.5 8V16" {...stroke} />
      <path d="M17.5 11V16" {...stroke} />
      <path d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75" {...stroke} />
    </Glyph>
  );
}

export function FilterGlyph(props: GlyphProps) {
  return (
    <Glyph label="filter-1" {...props}>
      <path
        d="M17.1716 4H6.82843C5.26633 4 4 5.26633 4 6.82843C4 7.57857 4.29799 8.29799 4.82843 8.82843L9.12132 13.1213C9.68393 13.6839 10 14.447 10 15.2426V20.057C10 20.7552 10.6974 21.2385 11.3511 20.9933L13.3511 20.2433C13.7414 20.097 14 19.7238 14 19.307V15.2426C14 14.447 14.3161 13.6839 14.8787 13.1213L19.1716 8.82843C19.702 8.29799 20 7.57857 20 6.82843C20 5.26633 18.7337 4 17.1716 4Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph label="plus-large" {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph label="search" {...props}>
      <circle cx="11" cy="11" r="7" {...stroke} />
      <path d="M20 20L16.05 16.05" {...stroke} />
    </Glyph>
  );
}

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph label="chevron-down-small" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...stroke}
      />
    </Glyph>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph label="checkmark-1" {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </Glyph>
  );
}

export function BranchGlyph(props: GlyphProps) {
  return (
    <Glyph label="branch-simple" {...props}>
      <path
        d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z"
        {...stroke}
      />
      <path
        d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z"
        {...stroke}
      />
      <path
        d="M6 3.5V15"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M15 6C10.0294 6 6 10.0294 6 15"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function ProjectGlyph(props: GlyphProps) {
  return (
    <Glyph label="box-2" {...props}>
      <path
        d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function AuthorGlyph(props: GlyphProps) {
  return (
    <Glyph label="user-edit" {...props}>
      <path
        d="M10 20H7.75C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12"
        {...stroke}
      />
      <circle
        cx="12"
        cy="7.75"
        r="4.25"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M14 20V17.9142C14 17.649 14.1054 17.3946 14.2929 17.2071L17.75 13.75C18.4404 13.0596 19.5596 13.0596 20.25 13.75C20.9404 14.4404 20.9404 15.5596 20.25 16.25L17.0858 19.4142C16.7107 19.7893 16.202 20 15.6716 20H14Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ThreadGlyph(props: GlyphProps) {
  return (
    <Glyph label="list-bullets" {...props}>
      <path
        d="M10 6L20 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" />
      <path
        d="M10 12L20 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M10 18L20 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="18" r="1.5" fill="currentColor" />
    </Glyph>
  );
}

export function CalendarGlyph(props: GlyphProps) {
  return (
    <Glyph label="calendar-4" {...props}>
      <path
        d="M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V8Z"
        {...stroke}
      />
      <path d="M8 5V3" {...stroke} />
      <path d="M16 5V3" {...stroke} />
    </Glyph>
  );
}

export function CalendarClockGlyph(props: GlyphProps) {
  return (
    <Glyph label="calendar-clock-4" {...props}>
      <path
        d="M8.5 20H7C5.34315 20 4 18.6569 4 17V8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V8.5M8 5V3M16 5V3"
        {...stroke}
      />
      <circle cx="17" cy="17" r="5" {...stroke} />
      <path d="M17 15.0002V16.9999L18.5 18.5002" {...stroke} />
    </Glyph>
  );
}

export function GroupingGlyph(props: GlyphProps) {
  return (
    <Glyph label="dot-grid-1x3-horizontal" {...props}>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        {...stroke}
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        {...stroke}
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        {...stroke}
      />
    </Glyph>
  );
}

export function DisplayGlyph(props: GlyphProps) {
  return (
    <Glyph label="settings-slider-three" {...props}>
      <path d="M5.95117 20.004V14.0015" {...stroke} />
      <path d="M5.95117 9.99999V3.99707" {...stroke} />
      <path d="M12 20.0038V13.0005" {...stroke} />
      <path d="M12 8.99915V3.99707" {...stroke} />
      <path d="M18.0488 20.0036V16.002" {...stroke} />
      <path d="M18.0488 12.0008V3.99707" {...stroke} />
      <path d="M10.0449 8.99902H13.9553" {...stroke} />
      <path d="M16.0938 16.002H20.0041" {...stroke} />
      <path d="M3.99609 14.0015H7.90643" {...stroke} />
    </Glyph>
  );
}

export function CrossGlyph(props: GlyphProps) {
  return (
    <Glyph label="cross-medium" {...props}>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function ChevronRightGlyph(props: GlyphProps) {
  return (
    <Glyph label="chevron-right-small" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...stroke}
      />
    </Glyph>
  );
}

const stateGlyphs: Record<
  PullState,
  { Glyph: (props: GlyphProps) => React.ReactNode; className: string }
> = {
  ready: { Glyph: PullRequestGlyph, className: "text-success" },
  pending: { Glyph: PullRequestGlyph, className: "text-warning-fg" },
  draft: { Glyph: PullDraftGlyph, className: "text-muted-foreground-2" },
  merged: { Glyph: PullMergedGlyph, className: "text-complete" },
  failed: { Glyph: PullFailedGlyph, className: "text-destructive" },
  closed: { Glyph: PullClosedGlyph, className: "text-destructive" },
};

export function PullStateIcon({
  state,
  className,
  ...props
}: GlyphProps & { state: PullState }) {
  const { Glyph, className: tone } = stateGlyphs[state];
  return (
    <Glyph
      className={["size-3 shrink-0", tone, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
