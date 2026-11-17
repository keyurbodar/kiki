import type { SVGProps } from "react";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

export function CurrencyDollarGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M6 17.3153C8.28571 21.5547 18 21.1591 18 16.4005C18 10.8575 6.5 13.7111 6.5 7.57143C6.5 3.25433 14.2288 2.52933 17.28 5.7319"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 22.5V1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronLeftSmallGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
