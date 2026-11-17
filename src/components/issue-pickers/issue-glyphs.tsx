import type { SVGProps } from "react";

export type IssueGlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({
  className = "size-full",
  children,
  ...props
}: IssueGlyphProps & { children: SVGProps<SVGSVGElement>["children"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

const line = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChevronDownSmallGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...line}
      />
    </Glyph>
  );
}

export function ChevronLeftSmallGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        {...line}
      />
    </Glyph>
  );
}

export function ChevronRightSmallGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...line}
      />
    </Glyph>
  );
}

export function CheckmarkGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.75L10 19L19 5" {...line} />
    </Glyph>
  );
}

export function CalendarGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V8Z"
        {...line}
      />
      <path d="M4 10H20" {...line} />
      <path d="M8 5V3" {...line} />
      <path d="M16 5V3" {...line} />
    </Glyph>
  );
}

export function CrossMediumGlyph(props: IssueGlyphProps) {
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

export function PlusLargeGlyph(props: IssueGlyphProps) {
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

export function TagGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5C7 7.22386 7.22386 7 7.5 7C7.77614 7 8 7.22386 8 7.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M3 10.7574V6C3 4.34315 4.34315 3 6 3H10.7574C11.553 3 12.3161 3.31607 12.8787 3.87868L20.1287 11.1287C21.3003 12.3003 21.3003 14.1997 20.1287 15.3713L15.3713 20.1287C14.1997 21.3003 12.3003 21.3003 11.1287 20.1287L3.87868 12.8787C3.31607 12.3161 3 11.553 3 10.7574Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M7.39844 7.5H7.59844"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CircleBanGlyph(props: IssueGlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C9.51472 21 7.26472 19.9926 5.63604 18.364C4.00736 16.7353 3 14.4853 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604C19.9926 7.26472 21 9.51472 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </Glyph>
  );
}
