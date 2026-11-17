import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode, SVGProps } from "react";

const glyphVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-(--icon-xs)",
      sm: "size-(--icon-sm)",
      base: "size-(--icon-base)",
      lg: "size-(--icon-lg)",
    },
  },
  defaultVariants: { size: "base" },
});

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> &
  VariantProps<typeof glyphVariants>;

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Glyph({
  name,
  size,
  className,
  children,
  ...props
}: GlyphProps & { name: string; children: ReactNode }) {
  return (
    <svg
      data-slot="icon"
      data-icon={name}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={glyphVariants({ size, className })}
      {...props}
    >
      {children}
    </svg>
  );
}

export function FlagGlyph(props: GlyphProps) {
  return (
    <Glyph name="flag-1" {...props}>
      <path
        d="M5 15V4C5 3.44772 5.44772 3 6 3H19.1315C19.9302 3 20.4066 3.89015 19.9635 4.5547L17.3698 8.4453C17.1459 8.7812 17.1459 9.2188 17.3698 9.5547L19.9635 13.4453C20.4066 14.1099 19.9302 15 19.1315 15H5ZM5 15V21"
        {...stroke}
      />
    </Glyph>
  );
}

export function ArrowUpRightGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-up-right" {...props}>
      <path d="M18 15V6M18 6H9M18 6L6.25 17.75" {...stroke} />
    </Glyph>
  );
}

export function ArrowRightGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-right" {...props}>
      <path d="M14 6L20 12L14 18" {...stroke} />
      <path d="M19 12H4" {...stroke} />
    </Glyph>
  );
}

export function CheckmarkGlyph(props: GlyphProps) {
  return (
    <Glyph name="checkmark-1" {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </Glyph>
  );
}

export function RotateGlyph(props: GlyphProps) {
  return (
    <Glyph name="arrow-rotate-clockwise" {...props}>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        {...stroke}
      />
      <path d="M19 4V8H15" {...stroke} />
    </Glyph>
  );
}

export function StarGlyph(props: GlyphProps) {
  return (
    <Glyph name="star" {...props}>
      <path
        d="M10.9907 2.63041C11.3958 1.78986 12.6042 1.78986 13.0093 2.63041L15.0244 6.81163C15.1874 7.14991 15.5122 7.38356 15.8875 7.43254L20.5265 8.038C21.4591 8.15972 21.8325 9.29762 21.1503 9.93882L17.7567 13.1284C17.4822 13.3865 17.3581 13.7645 17.427 14.1331L18.279 18.6885C18.4503 19.6043 17.4726 20.3075 16.6459 19.8633L12.5335 17.6533C12.2007 17.4745 11.7993 17.4745 11.4665 17.6533L7.35409 19.8633C6.52737 20.3075 5.54974 19.6043 5.72101 18.6885L6.57296 14.1331C6.64189 13.7645 6.51782 13.3865 6.24327 13.1284L2.84968 9.93882C2.16747 9.29762 2.54089 8.15972 3.47346 8.038L8.11245 7.43254C8.48776 7.38356 8.81257 7.14991 8.9756 6.81163L10.9907 2.63041Z"
        {...stroke}
      />
    </Glyph>
  );
}

export function BuildingsGlyph(props: GlyphProps) {
  return (
    <Glyph name="buildings" {...props}>
      <path d="M10 9H8" {...stroke} />
      <path d="M8 13H10" {...stroke} />
      <path
        d="M14 19V7C14 5.34315 12.6569 4 11 4H7C5.34315 4 4 5.34315 4 7V19"
        {...stroke}
      />
      <path d="M20 19V11C20 9.34315 18.6569 8 17 8H14" {...stroke} />
      <path d="M22 19H2" {...stroke} />
    </Glyph>
  );
}

export function UserGlyph(props: GlyphProps) {
  return (
    <Glyph name="user" {...props}>
      <path
        d="M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z"
        {...stroke}
      />
      <circle cx="12" cy="7.75" r="4.25" {...stroke} />
    </Glyph>
  );
}

export function ConsoleGlyph(props: GlyphProps) {
  return (
    <Glyph name="console" {...props}>
      <path
        d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        {...stroke}
      />
    </Glyph>
  );
}
