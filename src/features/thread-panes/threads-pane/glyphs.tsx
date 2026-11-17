import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ChevronLeftSmallGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function PlusLargeGlyph(props: GlyphProps) {
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

export function ChatBubbleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 20.5C16.9706 20.5 21 16.6944 21 12C21 7.30558 16.9706 3.5 12 3.5C7.02944 3.5 3 7.30558 3 12C3 13.4501 3.38446 14.8153 4.06236 16.0098C4.49657 16.7749 4.76387 17.6571 4.51434 18.5007C4.36519 19.0049 4.19064 19.5036 4 20C4.82664 19.949 5.62116 19.8458 6.39429 19.6881C7.15602 19.5328 7.94695 19.6275 8.67469 19.901C9.70341 20.2875 10.8254 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth="2"
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
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.8127 8C16.0834 5.1333 13.31 3 10 3C6.13401 3 3 5.91015 3 9.5C3 10.4893 3.238 11.4269 3.66372 12.2663C4.06707 13.0615 4.35342 13.9545 4.07357 14.8011C3.98311 15.0748 3.88363 15.3466 3.77778 15.6176C4.57776 15.5691 5.33906 15.4587 6.07776 15.2834C6.38617 15.2101 6.70998 15.2466 7 15.3745"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}
