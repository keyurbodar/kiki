import type { SVGProps } from "react";

/*
 * Capy's `images-1` and `cross-medium` icons, path for path from the bundle.
 * The shared sprite (src/primitives/icon) doesn't carry them yet; swap these
 * for <Icon name=…> once it does.
 */

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

export function ImagesIcon({ className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden
      data-icon="images-1"
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "size-(--icon-base) shrink-0"}
      {...props}
    >
      <path
        d="M4 14.2105L6.84488 12.0821C7.66137 11.5378 8.75215 11.6663 9.41987 12.3853C10.9123 13.9926 12.6426 15.4538 15 15.4538C17.1727 15.4538 18.6125 14.6485 20 13.261M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20ZM17 9C17 10.1046 16.1046 11 15 11C13.8954 11 13 10.1046 13 9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossMediumIcon({ className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden
      data-icon="cross-medium"
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "size-(--icon-base) shrink-0"}
      {...props}
    >
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
