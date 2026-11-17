import type { ComponentProps } from "react";

export type GlyphProps = Omit<ComponentProps<"svg">, "children">;

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function Glyph({
  className,
  paths,
  ...props
}: GlyphProps & { paths: ReadonlyArray<string> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      className={cx("size-(--icon-base) shrink-0", className)}
      {...props}
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export const DotsHorizontalGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z",
      "M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z",
      "M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z",
    ]}
    {...props}
  />
);

export const ChevronDownGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10",
    ]}
    {...props}
  />
);

export const ChevronRightGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8",
    ]}
    {...props}
  />
);

export const LockGlyphIcon = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z",
      "M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5",
      "M12 14V17",
    ]}
    {...props}
  />
);

export const CrossGlyph = (props: GlyphProps) => (
  <Glyph paths={["M8 8L16 16M16 8L8 16"]} {...props} />
);

export const PlusGlyph = (props: GlyphProps) => (
  <Glyph paths={["M12 4V12M12 12V20M12 12H4M12 12H20"]} {...props} />
);
