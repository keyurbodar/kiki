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

export const ArrowUpRightGlyph = (props: GlyphProps) => (
  <Glyph paths={["M18 15V6M18 6H9M18 6L6.25 17.75"]} {...props} />
);

export const ChevronLeftGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8",
    ]}
    {...props}
  />
);

export const CopyGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M15 9V5.25C15 4.00736 13.9926 3 12.75 3H5.25C4.00736 3 3 4.00736 3 5.25V12.75C3 13.9926 4.00736 15 5.25 15H9M11.25 9H18.75C19.9926 9 21 10.0074 21 11.25V18.75C21 19.9926 19.9926 21 18.75 21H11.25C10.0074 21 9 19.9926 9 18.75V11.25C9 10.0074 10.0074 9 11.25 9Z",
    ]}
    {...props}
  />
);

export const CheckGlyph = (props: GlyphProps) => (
  <Glyph paths={["M5 12.75L10 19L19 5"]} {...props} />
);
