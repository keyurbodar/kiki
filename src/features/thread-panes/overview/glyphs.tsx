import type { ReactNode, SVGProps } from "react";

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  name,
  children,
  strokeLinecap = "round",
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
      strokeLinecap={strokeLinecap}
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SortArrowUpDownGlyph(props: GlyphProps) {
  return (
    <Glyph name="sort-arrow-up-down" {...props}>
      <path d="M4 7C4 5.34315 5.34315 4 7 4C8.65685 4 10 5.34315 10 7C10 8.65685 8.65685 10 7 10C5.34315 10 4 8.65685 4 7Z" />
      <path d="M4 17C4 15.3431 5.34315 14 7 14C8.65685 14 10 15.3431 10 17C10 18.6569 8.65685 20 7 20C5.34315 20 4 18.6569 4 17Z" />
      <path d="M15 7.25L18 4.25L21 7.25" />
      <path d="M18 4.5V19.5" />
      <path d="M21 16.75L18 19.75L15 16.75" />
    </Glyph>
  );
}

export function BranchGlyph(props: GlyphProps) {
  return (
    <Glyph name="branch" {...props}>
      <circle cx="6.5" cy="6" r="2" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="6" r="2" />
      <path d="M6.5 8V16" />
      <path d="M17.5 8V9C17.5 10.6569 16.1569 12 14.5 12H9.5C7.84315 12 6.5 13.3431 6.5 15V16" />
    </Glyph>
  );
}

export function FilesGlyph(props: GlyphProps) {
  return (
    <Glyph name="files" {...props}>
      <path d="M11 3H13.7574C14.553 3 15.3161 3.31607 15.8787 3.87868L19.1213 7.12132C19.6839 7.68393 20 8.44699 20 9.24264V15C20 16.6569 18.6569 18 17 18H11C9.34315 18 8 16.6569 8 15V6C8 4.34315 9.34315 3 11 3Z" />
      <path d="M17 18C17 19.6569 15.6569 21 14 21H8C6.34315 21 5 19.6569 5 18V9C5 7.34315 6.34315 6 8 6" />
      <path d="M15 3V6C15 7.10457 15.8954 8 17 8H20" />
    </Glyph>
  );
}

export function StudioDisplayGlyph(props: GlyphProps) {
  return (
    <Glyph name="studio-display" strokeLinecap="square" {...props}>
      <path d="M9 17H6C4.34315 17 3 15.6569 3 14V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V14C21 15.6569 19.6569 17 18 17H15M9 17V20H15V17M9 17H15" />
    </Glyph>
  );
}

export function ConsoleGlyph(props: GlyphProps) {
  return (
    <Glyph name="console" {...props}>
      <path d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z" />
    </Glyph>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph name="globe" strokeLinecap="square" {...props}>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
      <path d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z" />
      <path d="M21 12H3" />
    </Glyph>
  );
}

export function ChainLinkGlyph(props: GlyphProps) {
  return (
    <Glyph name="chain-link-1" {...props}>
      <path d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11" />
      <path d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995" />
      <path d="M9 15L15 9" />
    </Glyph>
  );
}

export function ArrowRightGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-right" {...props}>
      <path d="M14 6L20 12L14 18" />
      <path d="M19 12H4" />
    </Glyph>
  );
}

export function ArrowShareRightGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-share-right" strokeLinecap="butt" {...props}>
      <path d="M21.6956 11.2833L14.629 4.40271C13.9953 3.78568 12.9314 4.23469 12.9314 5.11918V7.99977C12.9314 8.27591 12.7036 8.49935 12.4275 8.50341C4.47224 8.6202 2.01619 11.5656 1.9336 19.5722C1.93251 19.6777 2.07478 19.7147 2.12292 19.6208C3.50171 16.9313 4.74379 15.5583 12.4265 15.5016C12.7026 15.4996 12.9314 15.7236 12.9314 15.9998V18.8804C12.9314 19.7648 13.9953 20.2139 14.629 19.5968L21.6956 12.7162C22.0988 12.3237 22.0988 11.6759 21.6956 11.2833Z" />
    </Glyph>
  );
}

export function CheckmarkGlyph(props: GlyphProps) {
  return (
    <Glyph name="checkmark-1" {...props}>
      <path d="M5 12.75L10 19L19 5" />
    </Glyph>
  );
}

export function LaptopGlyph(props: GlyphProps) {
  return (
    <Glyph name="macbook" strokeLinecap="square" {...props}>
      <path d="M2 16H22V17.5C22 18.8807 20.8807 20 19.5 20H4.5C3.11929 20 2 18.8807 2 17.5V16Z" />
      <path d="M20 15.75V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V15.75" />
    </Glyph>
  );
}

export function CloudGlyph(props: GlyphProps) {
  return (
    <Glyph name="cloud" {...props}>
      <path d="M7 19C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H7Z" />
    </Glyph>
  );
}
