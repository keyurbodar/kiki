import type { SVGProps } from "react";

/*
 * Icons the appearance screens need that the shared sprite (A1) doesn't ship
 * yet. Paths are Capy's, copied from its rendered Appearance page.
 */
type GlyphProps = SVGProps<SVGSVGElement>;

const Glyph = ({ children, className, ...props }: GlyphProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    className={className ?? "size-(--icon-sm)"}
    {...props}
  >
    {children}
  </svg>
);

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const PlusIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path d="M12 4V12M12 12V20M12 12H4M12 12H20" {...stroke} />
  </Glyph>
);

export const PlusSmallIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5" {...stroke} />
  </Glyph>
);

export const ChevronDownIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path
      d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
      {...stroke}
    />
  </Glyph>
);

export const ChevronRightIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path
      d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
      {...stroke}
    />
  </Glyph>
);

export const CheckIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path d="M5 12.5L9.5 17L19 7" {...stroke} />
  </Glyph>
);

export const TrashIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path
      d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5"
      {...stroke}
    />
    <path d="M10 11V16" {...stroke} />
    <path d="M14 11V16" {...stroke} />
    <path d="M3.5 6H20.5" {...stroke} />
    <path
      d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621"
      {...stroke}
    />
  </Glyph>
);

export const ReplaceImageIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path
      d="M11 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V13"
      {...stroke}
    />
    <path
      d="M13 11V7.99998L17.5 3.49998C18.3284 2.67156 19.6716 2.67156 20.5 3.49998C21.3284 4.32841 21.3284 5.67155 20.5 6.49998L16 11H13Z"
      {...stroke}
    />
  </Glyph>
);

export const CloudUploadIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path d="M12 19V12M12 12L14.5 14.5M12 12L9.5 14.5" {...stroke} />
    <path
      d="M8 19H7C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H16"
      {...stroke}
    />
  </Glyph>
);

export const ArrowUpIcon = (props: GlyphProps) => (
  <Glyph {...props}>
    <path d="M12 5V20" {...stroke} />
    <path d="M6 10L12 4L18 10" {...stroke} />
  </Glyph>
);
