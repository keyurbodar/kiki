import type { SVGProps } from "react";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  children,
  ...props
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CrossGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CreditCardGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M3 10V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V10M3 10V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V10M3 10H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}
