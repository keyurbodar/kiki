import type { SVGProps } from "react";

export function ClipboardGlyph(
  props: Omit<SVGProps<SVGSVGElement>, "children">,
) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M15 5H16C17.6569 5 19 6.34315 19 8V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V8C5 6.34315 6.34315 5 8 5H9M15 7V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V7H15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
