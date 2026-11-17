import type { ComponentProps, ReactNode } from "react";

/**
 * Capy's own line icons that the tab strip uses and the sprite does not carry
 * yet, copied path for path from Capy's icon components (24-unit grid).
 */
type GlyphProps = Omit<ComponentProps<"svg">, "children">;

const line = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Glyph({
  className,
  children,
  ...props
}: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "size-(--icon-sm) shrink-0"}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ListBulletsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10 6L20 6" {...line} strokeLinejoin={undefined} />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" />
      <path d="M10 12L20 12" {...line} strokeLinejoin={undefined} />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <path d="M10 18L20 18" {...line} strokeLinejoin={undefined} />
      <circle cx="4.5" cy="18" r="1.5" fill="currentColor" />
    </Glyph>
  );
}

export function BranchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="6.5" cy="6" r="2" {...line} />
      <circle cx="6.5" cy="18" r="2" {...line} />
      <circle cx="17.5" cy="6" r="2" {...line} />
      <path d="M6.5 8V16" {...line} />
      <path
        d="M17.5 8V9C17.5 10.6569 16.1569 12 14.5 12H9.5C7.84315 12 6.5 13.3431 6.5 15V16"
        {...line}
      />
    </Glyph>
  );
}

export function FilesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M11 3H13.7574C14.553 3 15.3161 3.31607 15.8787 3.87868L19.1213 7.12132C19.6839 7.68393 20 8.44699 20 9.24264V15C20 16.6569 18.6569 18 17 18H11C9.34315 18 8 16.6569 8 15V6C8 4.34315 9.34315 3 11 3Z"
        {...line}
      />
      <path
        d="M17 18C17 19.6569 15.6569 21 14 21H8C6.34315 21 5 19.6569 5 18V9C5 7.34315 6.34315 6 8 6"
        {...line}
      />
      <path d="M15 3V6C15 7.10457 15.8954 8 17 8H20" {...line} />
    </Glyph>
  );
}

export function SetupGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M19 5.5C19 6.88071 15.866 8 12 8C8.13401 8 5 6.88071 5 5.5M19 5.5C19 4.11929 15.866 3 12 3C8.13401 3 5 4.11929 5 5.5M19 5.5V18.5C19 19.8807 15.866 21 12 21C8.13401 21 5 19.8807 5 18.5V5.5M19 9.75C19 11.1307 15.866 12.25 12 12.25C8.13401 12.25 5 11.1307 5 9.75M19 14C19 15.3807 15.866 16.5 12 16.5C8.13401 16.5 5 15.3807 5 14"
        {...line}
      />
    </Glyph>
  );
}

export function CircleDashedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...line}
        strokeDasharray="3 4"
      />
    </Glyph>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
      <path
        d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
      <path
        d="M21 12H3"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
    </Glyph>
  );
}

export function ChatBubbleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 20.5C16.9706 20.5 21 16.6944 21 12C21 7.30558 16.9706 3.5 12 3.5C7.02944 3.5 3 7.30558 3 12C3 13.4501 3.38446 14.8153 4.06236 16.0098C4.49657 16.7749 4.76387 17.6571 4.51434 18.5007C4.36519 19.0049 4.19064 19.5036 4 20C4.82664 19.949 5.62116 19.8458 6.39429 19.6881C7.15602 19.5328 7.94695 19.6275 8.67469 19.901C9.70341 20.2875 10.8254 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ChatBubblesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M15.5 21C12.4624 21 10 18.7614 10 16C10 13.2386 12.4624 11 15.5 11C18.5376 11 21 13.2386 21 16C21 16.6409 20.8673 17.2537 20.6256 17.8169C20.268 18.6501 19.9572 19.5574 20.2736 20.4072C20.3107 20.507 20.3492 20.6065 20.3889 20.7059C20.0329 20.6848 19.6866 20.6483 19.3477 20.5962C18.6055 20.4821 17.8443 20.5768 17.1212 20.7792C16.6087 20.9227 16.0643 21 15.5 21Z"
        {...line}
      />
      <path
        d="M16.8127 8C16.0834 5.1333 13.31 3 10 3C6.13401 3 3 5.91015 3 9.5C3 10.4893 3.238 11.4269 3.66372 12.2663C4.06707 13.0615 4.35342 13.9545 4.07357 14.8011C3.98311 15.0748 3.88363 15.3466 3.77778 15.6176C4.57776 15.5691 5.33906 15.4587 6.07776 15.2834C6.38617 15.2101 6.70998 15.2466 7 15.3745"
        {...line}
      />
    </Glyph>
  );
}

export function ConsoleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        {...line}
      />
    </Glyph>
  );
}

export function DisplayGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M9 17H6C4.34315 17 3 15.6569 3 14V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V14C21 15.6569 19.6569 17 18 17H15M9 17V20H15V17M9 17H15"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function PullRequestGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="6" cy="6" r="2" {...line} />
      <circle cx="6" cy="18" r="2" {...line} />
      <circle cx="18" cy="18" r="2" {...line} />
      <path d="M6 8V16" {...line} />
      <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" {...line} />
      <path d="M14 4L12 6L14 8" {...line} />
    </Glyph>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
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
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.75L10 19L19 5" {...line} />
    </Glyph>
  );
}

export function LinkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11"
        {...line}
      />
      <path
        d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995"
        {...line}
      />
      <path d="M9 15L15 9" {...line} />
    </Glyph>
  );
}

export function ArrowLeftGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10 6L4 12L10 18" {...line} />
      <path d="M5 12H20" {...line} />
    </Glyph>
  );
}

export function ArrowRightGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M14 6L20 12L14 18" {...line} />
      <path d="M19 12H4" {...line} />
    </Glyph>
  );
}

export function UndoGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6.49977 5L3.56043 7.93934C2.97465 8.52513 2.97465 9.47487 3.56043 10.0607L6.49977 13"
        {...line}
      />
      <path
        d="M4 9H16.5C18.9853 9 21 11.0147 21 13.5C21 15.9853 18.9853 18 16.5 18H12"
        {...line}
      />
    </Glyph>
  );
}

export function PhoneGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 19H14M9 22H15C16.6569 22 18 20.6569 18 19V5C18 3.34315 16.6569 2 15 2H9C7.34315 2 6 3.34315 6 5V19C6 20.6569 7.34315 22 9 22Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function ChevronRightGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...line}
      />
    </Glyph>
  );
}

export function BrowserTabsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M18 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5Z"
        {...line}
      />
      <path d="M6.5 8.5L10.5 8.5" {...line} />
      <path d="M17 8.5H17.5" {...line} />
      <path d="M13.5 8.5H14" {...line} />
    </Glyph>
  );
}

export function SplitRightGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M8 7C8 5.34315 9.34315 4 11 4L13 4C14.6569 4 16 5.34315 16 7L16 17C16 18.6569 14.6569 20 13 20H11C9.34315 20 8 18.6569 8 17L8 7Z"
        {...line}
      />
      <path d="M20 4V20" {...line} />
      <path d="M4 4V20" {...line} />
    </Glyph>
  );
}

export function SplitDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M17 8C18.6569 8 20 9.34315 20 11L20 13C20 14.6569 18.6569 16 17 16L7 16C5.34315 16 4 14.6569 4 13V11C4 9.34315 5.34315 8 7 8L17 8Z"
        {...line}
      />
      <path d="M20 20H4" {...line} />
      <path d="M20 4H4" {...line} />
    </Glyph>
  );
}
