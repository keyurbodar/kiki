import type { ReactNode, SVGProps } from "react";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  icon,
  children,
  ...props
}: GlyphProps & { icon: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      data-icon={icon}
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChevronRightSmallGlyph(props: GlyphProps) {
  return (
    <Glyph icon="chevron-right-small" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...stroke}
      />
    </Glyph>
  );
}

export function ArrowLeftGlyph(props: GlyphProps) {
  return (
    <Glyph icon="arrow-left" {...props}>
      <path d="M10 6L4 12L10 18" {...stroke} />
      <path d="M5 12H20" {...stroke} />
    </Glyph>
  );
}

export function ArrowUpRightGlyph(props: GlyphProps) {
  return (
    <Glyph icon="arrow-up-right" {...props}>
      <path d="M18 15V6M18 6H9M18 6L6.25 17.75" {...stroke} />
    </Glyph>
  );
}

export function ClockGlyph(props: GlyphProps) {
  return (
    <Glyph icon="clock, time, timer" {...props}>
      <path
        d="M12 8V12L14.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...stroke}
      />
    </Glyph>
  );
}
