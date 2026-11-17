import type { SVGProps } from "react";

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const paths = {
  "chevron-down-small": (
    <path
      d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
      {...stroke}
    />
  ),
  "chevron-right-small": (
    <path
      d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
      {...stroke}
    />
  ),
  "chevron-left-small": (
    <path
      d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
      {...stroke}
    />
  ),
  "cross-small": <path d="M8 8L16 16M16 8L8 16" {...stroke} />,
  "cross-medium": <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" {...stroke} />,
  "minus-small": <path d="M7 12H17" {...stroke} />,
  "plus-large": <path d="M12 4V12M12 12V20M12 12H4M12 12H20" {...stroke} />,
  "arrow-up-right": <path d="M18 15V6M18 6H9M18 6L6.25 17.75" {...stroke} />,
  "arrow-rotate-clockwise": (
    <>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        {...stroke}
      />
      <path d="M19 4V8H15" {...stroke} />
    </>
  ),
  "deep-search": (
    <>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={2} />
      <path
        d="M15 15L17 17"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M14.8735 20.5309C13.0122 21.1564 10.9868 21.1564 9.12546 20.5309M20.5304 9.12595C21.1559 10.9873 21.1559 13.0126 20.5304 14.874M9.12549 3.46912C10.9869 2.84362 13.0122 2.84363 14.8736 3.46913M3.46864 14.874C2.84314 13.0127 2.84313 10.9874 3.46864 9.12598"
        {...stroke}
      />
    </>
  ),
  "layers-three": (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3161 3.18487C11.7576 3.02432 12.2416 3.02431 12.6831 3.18487L20.7569 6.1208C22.5123 6.75911 22.5123 9.24166 20.7569 9.87998L12.6831 12.8159C12.2416 12.9765 11.7576 12.9765 11.3161 12.8159L3.2423 9.87998C1.48695 9.24167 1.48693 6.75912 3.24229 6.1208L11.3161 3.18487ZM20.0734 8.00039L11.9996 5.06445L3.92578 8.00039L11.9996 10.9363L20.0734 8.00039Z"
        fill="currentColor"
      />
      <path
        d="M20.7569 13.88L12.6831 16.8159C12.2416 16.9765 11.7576 16.9765 11.3161 16.8159L3.2423 13.88C2.10327 13.4658 1.70334 12.2751 2.04252 11.3156L11.9996 14.9363L21.9567 11.3156C22.2959 12.2751 21.896 13.4658 20.7569 13.88Z"
        fill="currentColor"
      />
      <path
        d="M20.7569 17.88L12.6831 20.8159C12.2416 20.9765 11.7576 20.9765 11.3161 20.8159L3.2423 17.88C2.10327 17.4658 1.70334 16.2751 2.04252 15.3156L11.9996 18.9363L21.9567 15.3156C22.2959 16.2751 21.896 17.4658 20.7569 17.88Z"
        fill="currentColor"
      />
    </>
  ),
  "pull-request": (
    <>
      <circle cx="6" cy="6" r="2" {...stroke} />
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="18" r="2" {...stroke} />
      <path d="M6 8V16" {...stroke} />
      <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
      <path d="M14 4L12 6L14 8" {...stroke} />
    </>
  ),
  merged: (
    <>
      <circle cx="6" cy="6" r="2" {...stroke} />
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="18" r="2" {...stroke} />
      <path d="M6 8V16" {...stroke} />
      <path d="M8 6H15C16.6569 6 18 7.34315 18 9V16" {...stroke} />
    </>
  ),
  draft: (
    <>
      <circle cx="6.5" cy="6" r="2" {...stroke} />
      <circle cx="6.5" cy="18" r="2" {...stroke} />
      <circle cx="17.5" cy="18" r="2" {...stroke} />
      <path d="M6.5 8V16" {...stroke} />
      <path
        d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z"
        {...stroke}
      />
      <path
        d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z"
        {...stroke}
      />
    </>
  ),
  "shield-crossed": (
    <path
      d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
      {...stroke}
    />
  ),
  "request-closed": (
    <>
      <circle cx="6.5" cy="6" r="2" {...stroke} />
      <circle cx="6.5" cy="18" r="2" {...stroke} />
      <circle cx="17.5" cy="18" r="2" {...stroke} />
      <path d="M6.5 8V16" {...stroke} />
      <path d="M17.5 11V16" {...stroke} />
      <path d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75" {...stroke} />
    </>
  ),
} as const;

export type PullGlyphName = keyof typeof paths;

export type PullGlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: PullGlyphName;
};

/**
 * Capy's pull-view icons that the generated sprite does not carry yet, drawn
 * from the same 24-unit paths. Sized by className like Capy's raw-mode icons.
 */
export function PullGlyph({ name, className, ...props }: PullGlyphProps) {
  return (
    <svg
      data-slot="icon"
      data-icon={name}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "size-(--icon-sm) shrink-0"}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export type SpinnerProps = { className?: string; label?: string };

/** Stand-in for Capy's status spinner until the loading primitives land. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block size-(--icon-sm) shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ""}`}
    />
  );
}
