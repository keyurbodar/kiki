import type { SVGProps } from "react";

/**
 * Icons Capy's drive detail page imports from its shared icon set that the
 * sprite in `src/primitives/icon` does not carry yet. Paths are Capy's own;
 * move them to the sprite when the assets package adds them.
 */
type DetailIconProps = SVGProps<SVGSVGElement>;

const stroke = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function TrashIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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
    </svg>
  );
}

export function ChevronDownSmallIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...stroke}
      />
    </svg>
  );
}

export function ChevronRightSmallIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...stroke}
      />
    </svg>
  );
}

export function ArrowRotateClockwiseIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        {...stroke}
      />
      <path d="M19 4V8H15" {...stroke} />
    </svg>
  );
}

export function ArrowLeftIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M10 6L4 12L10 18" {...stroke} />
      <path d="M5 12H20" {...stroke} />
    </svg>
  );
}

export function ArrowUndoUpIcon(props: DetailIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6.49977 5L3.56043 7.93934C2.97465 8.52513 2.97465 9.47487 3.56043 10.0607L6.49977 13"
        {...stroke}
      />
      <path
        d="M4 9H16.5C18.9853 9 21 11.0147 21 13.5C21 15.9853 18.9853 18 16.5 18H12"
        {...stroke}
      />
    </svg>
  );
}
