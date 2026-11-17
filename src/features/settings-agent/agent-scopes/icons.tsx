import type { ComponentProps } from "react";

/**
 * Capy's CDS glyphs these settings pages use. The shared sprite in
 * `@/primitives/icon` does not carry them yet; swap these for `<Icon>` once it does.
 */
type GlyphProps = Omit<ComponentProps<"svg">, "children">;

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function Glyph({
  className,
  children,
  name,
  ...props
}: GlyphProps & { name: string; children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      data-slot="icon"
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      className={cx("size-(--icon-sm) shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const BuildingsIcon = (props: GlyphProps) => (
  <Glyph name="buildings" {...props}>
    <path d="M10 9H8" {...stroke} />
    <path d="M8 13H10" {...stroke} />
    <path
      d="M14 19V7C14 5.34315 12.6569 4 11 4H7C5.34315 4 4 5.34315 4 7V19"
      {...stroke}
    />
    <path d="M20 19V11C20 9.34315 18.6569 8 17 8H14" {...stroke} />
    <path d="M3 19H21" {...stroke} />
  </Glyph>
);

export const UserIcon = (props: GlyphProps) => (
  <Glyph name="user" {...props}>
    <path
      d="M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z"
      {...stroke}
    />
    <circle cx="12" cy="7.75" r="4.25" {...stroke} />
  </Glyph>
);

export const InboxIcon = (props: GlyphProps) => (
  <Glyph name="box-2" {...props}>
    <path
      d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
      {...stroke}
      strokeLinecap="square"
    />
  </Glyph>
);

export const LayersIcon = (props: GlyphProps) => (
  <Glyph name="square-behind-square-2" {...props}>
    <path
      d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
      {...stroke}
    />
  </Glyph>
);

export const ChevronDownSmallIcon = (props: GlyphProps) => (
  <Glyph name="chevron-down-small" {...props}>
    <path
      d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
      {...stroke}
    />
  </Glyph>
);

export const ChevronRightSmallIcon = (props: GlyphProps) => (
  <Glyph name="chevron-right-small" {...props}>
    <path
      d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
      {...stroke}
    />
  </Glyph>
);

export const CheckmarkIcon = (props: GlyphProps) => (
  <Glyph name="checkmark-1" {...props}>
    <path d="M5 12.75L10 19L19 5" {...stroke} />
  </Glyph>
);

export const PlusIcon = (props: GlyphProps) => (
  <Glyph name="plus-medium" {...props}>
    <path d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5" {...stroke} />
  </Glyph>
);

export const SearchIcon = (props: GlyphProps) => (
  <Glyph name="magnifying-glass" {...props}>
    <path
      d="M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z"
      {...stroke}
    />
    <path d="M20 20L16.05 16.05" {...stroke} />
  </Glyph>
);

export const CrossIcon = (props: GlyphProps) => (
  <Glyph name="cross-medium" {...props}>
    <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" {...stroke} />
  </Glyph>
);
