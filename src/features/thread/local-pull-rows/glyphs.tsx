import type { ReactNode, SVGProps } from "react";

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  name,
  children,
  ...props
}: GlyphProps & { name: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PullRequestGlyph(props: GlyphProps) {
  return (
    <Glyph name="pull-request" {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8V16" />
      <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" />
      <path d="M14 4L12 6L14 8" />
    </Glyph>
  );
}

export function DraftGlyph(props: GlyphProps) {
  return (
    <Glyph name="draft" {...props}>
      <circle cx="6.5" cy="6" r="2" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="M6.5 8V16" />
      <path d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z" />
      <path d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z" />
    </Glyph>
  );
}

export function MergedGlyph(props: GlyphProps) {
  return (
    <Glyph name="merged" {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8V16" />
      <path d="M8 6H15C16.6569 6 18 7.34315 18 9V16" />
    </Glyph>
  );
}

export function ShieldCrossedGlyph(props: GlyphProps) {
  return (
    <Glyph name="shield-crossed" {...props}>
      <path d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z" />
    </Glyph>
  );
}

export function RequestClosedGlyph(props: GlyphProps) {
  return (
    <Glyph name="request-closed" {...props}>
      <circle cx="6.5" cy="6" r="2" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="M6.5 8V16" />
      <path d="M17.5 11V16" />
      <path d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75" />
    </Glyph>
  );
}

export function ArrowUpRightGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-up-right" {...props}>
      <path d="M18 15V6M18 6H9M18 6L6.25 17.75" />
    </Glyph>
  );
}

export function RotateClockwiseGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-rotate-clockwise" {...props}>
      <path d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8" />
      <path d="M19 4V8H15" />
    </Glyph>
  );
}

export function DotGridGlyph(props: GlyphProps) {
  return (
    <Glyph name="dot-grid-1x3-horizontal" {...props}>
      <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" />
      <path d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z" />
      <path d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z" />
    </Glyph>
  );
}

export function ChevronRightSmallGlyph(props: GlyphProps) {
  return (
    <Glyph name="chevron-right-small" {...props}>
      <path d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8" />
    </Glyph>
  );
}

export function TrashGlyph(props: GlyphProps) {
  return (
    <Glyph name="trash-can" {...props}>
      <path d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5" />
      <path d="M10 11V16" />
      <path d="M14 11V16" />
      <path d="M3.5 6H20.5" />
      <path d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621" />
    </Glyph>
  );
}
