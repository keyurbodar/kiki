import type { ComponentProps, ReactNode } from "react";

export type GlyphProps = Omit<ComponentProps<"svg">, "children">;

function Glyph({ children, ...props }: GlyphProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
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

export function DownloadGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M20 15V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V15M12 14.5V4M12 14.5L8.5 11M12 14.5L15.5 11"
        {...stroke}
      />
    </Glyph>
  );
}

export function OpenExternalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M9 6H8.8C7.11984 6 6.27976 6 5.63803 6.32698C5.07354 6.6146 4.6146 7.07354 4.32698 7.63803C4 8.27976 4 9.11984 4 10.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H13.2C14.8802 20 15.7202 20 16.362 19.673C16.9265 19.3854 17.3854 18.9265 17.673 18.362C18 17.7202 18 16.8802 18 15.2V15"
        {...stroke}
      />
      <path d="M14 4H20M20 4V10M20 4L11 13" {...stroke} />
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

export function LinkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11"
        {...stroke}
      />
      <path
        d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995"
        {...stroke}
      />
      <path d="M9 15L15 9" {...stroke} />
    </Glyph>
  );
}

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

export function ArrowLeftGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10 6L4 12L10 18" {...stroke} />
      <path d="M5 12H20" {...stroke} />
    </Glyph>
  );
}
