import type { SVGProps } from "react";

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

const cx = (...parts: ReadonlyArray<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function Glyph({
  children,
  className,
  ...props
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cx("size-(--icon-sm) shrink-0", className)}
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

export function ChevronDownSmallGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...stroke}
      />
    </Glyph>
  );
}

export function ChevronRightSmallGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...stroke}
      />
    </Glyph>
  );
}

export function CheckmarkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </Glyph>
  );
}

export function CrossMediumGlyph(props: GlyphProps) {
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

export function BubbleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6.00195 4H18.002C19.6588 4 21.002 5.34315 21.002 7V15C21.002 16.6569 19.6588 18 18.002 18H12.002L7.00195 21V18H6.00195C4.3451 18 3.00195 16.6569 3.00195 15V7C3.00195 5.34315 4.3451 4 6.00195 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CopyGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        {...stroke}
      />
    </Glyph>
  );
}

export function DotsHorizontalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
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

export function RotateClockwiseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        {...stroke}
      />
      <path d="M19 4V8H15" {...stroke} />
    </Glyph>
  );
}

export { cx };
