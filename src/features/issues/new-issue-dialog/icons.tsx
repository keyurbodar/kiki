import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinecap="square" {...props}>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
      <path d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z" />
      <path d="M21 12H3" />
    </Glyph>
  );
}

export function LockGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z" />
      <path d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5" />
      <path d="M12 14V17" />
    </Glyph>
  );
}

export function UserGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinejoin="round" {...props}>
      <path d="M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z" />
      <circle cx="12" cy="7.75" r="4.25" />
    </Glyph>
  );
}

export function FolderGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V10C21 8.34315 19.6569 7 18 7H13.0704C12.4017 7 11.7772 6.6658 11.4063 6.1094L10.5937 4.8906C10.2228 4.3342 9.59834 4 8.92963 4H6C4.34315 4 3 5.34315 3 7Z" />
    </Glyph>
  );
}

export function HomeGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinejoin="round" {...props}>
      <path d="M4 10.2847C4 9.44537 4 9.02572 4.10594 8.63772C4.1998 8.29397 4.35414 7.9697 4.56174 7.68009C4.79607 7.3532 5.12176 7.08857 5.77316 6.55932L8.97316 3.95932C10.0521 3.08266 10.5916 2.64434 11.1913 2.47646C11.7203 2.3284 12.2797 2.3284 12.8087 2.47646C13.4084 2.64434 13.9479 3.08266 15.0268 3.95932L18.2268 6.55932C18.8782 7.08857 19.2039 7.3532 19.4383 7.68009C19.6459 7.9697 19.8002 8.29397 19.8941 8.63772C20 9.02572 20 9.44537 20 10.2847V15.2C20 16.8802 20 17.7202 19.673 18.362C19.3854 18.9265 18.9265 19.3854 18.362 19.673C17.7202 20 16.8802 20 15.2 20H8.8C7.11984 20 6.27976 20 5.63803 19.673C5.07354 19.3854 4.6146 18.9265 4.32698 18.362C4 17.7202 4 16.8802 4 15.2V10.2847Z" />
    </Glyph>
  );
}

export function GearGlyph(props: GlyphProps) {
  return (
    <Glyph strokeLinecap="square" strokeLinejoin="round" {...props}>
      <path d="M10.53 3.82729C11.4432 3.31361 12.5583 3.31361 13.4715 3.82729L18.4716 6.63977C19.4162 7.17112 20.0008 8.17067 20.0008 9.2545L20.0008 14.7454C20.0008 15.8292 19.4162 16.8288 18.4715 17.3601L13.4715 20.1726C12.5583 20.6863 11.4432 20.6863 10.53 20.1726L5.53008 17.3604C4.58539 16.8291 4.00077 15.8295 4.00077 14.7456L4.00077 9.25448C4.00077 8.17065 4.58536 7.17109 5.53 6.63974L10.53 3.82729Z" />
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
    </Glyph>
  );
}
