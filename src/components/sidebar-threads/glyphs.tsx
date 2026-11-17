import type { SVGProps } from "react";

const GLYPHS = {
  "plus-large": (
    <>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  "dot-grid-1x3-horizontal": (
    <>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "folder-add-left": (
    <>
      <path
        d="M3 10V7C3 5.34315 4.34315 4 6 4H8.92963C9.59834 4 10.2228 4.3342 10.5937 4.8906L11.4063 6.1094C11.7772 6.6658 12.4017 7 13.0704 7H18C19.6569 7 21 8.34315 21 10V16C21 17.6569 19.6569 19 18 19H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14V17V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17H5H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "email-2-check": (
    <>
      <path
        d="M3.28809 8.64404L10.6583 12.3291C11.5029 12.7514 12.497 12.7514 13.3415 12.3292L20.4652 8.76737C20.793 8.60351 21 8.26854 21 7.90212C21 6.29933 19.7007 5 18.0979 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19H11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 14L18 19.5L16 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "box-2": (
    <>
      <path
        d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </>
  ),
  "sort-arrow-up-down": (
    <>
      <path
        d="M4 7C4 5.34315 5.34315 4 7 4C8.65685 4 10 5.34315 10 7C10 8.65685 8.65685 10 7 10C5.34315 10 4 8.65685 4 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17C4 15.3431 5.34315 14 7 14C8.65685 14 10 15.3431 10 17C10 18.6569 8.65685 20 7 20C5.34315 20 4 18.6569 4 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7.25L18 4.25L21 7.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 4.5V19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 16.75L18 19.75L15 16.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "arrow-rotate-clockwise": (
    <>
      <path
        d="M19.5165 14.6667C18.4182 17.7738 15.4549 20 11.9717 20C7.5534 20 3.97168 16.4183 3.97168 12C3.97168 7.58172 7.5534 4 11.9717 4C15.0676 4 17 5.5 19 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 4V8H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "calendar-clock-4": (
    <>
      <path
        d="M8.5 20H7C5.34315 20 4 18.6569 4 17V8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V8.5M8 5V3M16 5V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17"
        cy="17"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 15.0002V16.9999L18.5 18.5002"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "eye-open": (
    <>
      <path
        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.2246 10.6522C16.4094 3.11588 7.59077 3.11597 2.77557 10.6523C2.25157 11.4724 2.25157 12.5277 2.77557 13.3478C7.59077 20.8841 16.4094 20.884 21.2246 13.3477C21.7486 12.5276 21.7486 11.4723 21.2246 10.6522Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "list-bullets": (
    <>
      <path
        d="M10 6L20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" />
      <path
        d="M10 12L20 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M10 18L20 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="18" r="1.5" fill="currentColor" />
    </>
  ),
  "text-block": (
    <>
      <path
        d="M13 5.5H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 8.5H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 15.5H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 18.5H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17C4 15.8954 4.89543 15 6 15C7.10457 15 8 15.8954 8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7C4 5.89543 4.89543 5 6 5C7.10457 5 8 5.89543 8 7C8 8.10457 7.10457 9 6 9C4.89543 9 4 8.10457 4 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  "checkmark-1": (
    <>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "magnifying-glass": (
    <>
      <path
        d="M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 20L16.05 16.05"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  "filter-1": (
    <>
      <path
        d="M17.1716 4H6.82843C5.26633 4 4 5.26633 4 6.82843C4 7.57857 4.29799 8.29799 4.82843 8.82843L9.12132 13.1213C9.68393 13.6839 10 14.447 10 15.2426V20.057C10 20.7552 10.6974 21.2385 11.3511 20.9933L13.3511 20.2433C13.7414 20.097 14 19.7238 14 19.307V15.2426C14 14.447 14.3161 13.6839 14.8787 13.1213L19.1716 8.82843C19.702 8.29799 20 7.57857 20 6.82843C20 5.26633 18.7337 4 17.1716 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  ),
  "chevron-down-small": (
    <>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  archive: (
    <>
      <path
        d="M20 15.2V10.6C20 10.0399 20 9.75992 19.891 9.54601C19.7951 9.35785 19.6422 9.20487 19.454 9.10899C19.2401 9 18.9601 9 18.4 9H5.6C5.03995 9 4.75992 9 4.54601 9.10899C4.35785 9.20487 4.20487 9.35785 4.10899 9.54601C4 9.75992 4 10.0399 4 10.6V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M6 8V4C6 3.44772 6.44772 3 7 3H10.0858C10.351 3 10.6054 3.10536 10.7929 3.29289L12.2071 4.70711C12.3946 4.89464 12.649 5 12.9142 5H17C17.5523 5 18 5.44772 18 6V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13L12 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  unpin: (
    <>
      <path
        d="M12.2643 6.08069L13.0884 4.55025C14.0411 2.78087 16.4301 2.43024 17.8511 3.85123L20.1489 6.14899C21.5699 7.56999 21.2192 9.95898 19.4499 10.9117L17.9194 11.7358M8 16.0001L10.9709 18.971C12.7694 20.7695 15.8496 19.6544 16.0799 17.1213L16.1364 16.5001M8 16.0001L5.02911 13.0292C3.23057 11.2307 4.34575 8.1505 6.87882 7.92022L7.5 7.86375M8 16.0001L4 20.0001M3 3.00011L21 21.0001"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  pin: (
    <>
      <path
        d="M4 20L8 16M5.02911 13.0291L10.9709 18.9709C12.7694 20.7694 15.8496 19.6542 16.0799 17.1212L16.354 14.1055C16.4452 13.103 17.0331 12.213 17.9194 11.7357L19.4499 10.9116C21.2192 9.95887 21.5699 7.56988 20.1489 6.14888L17.8511 3.85112C16.4301 2.43013 14.0411 2.78076 13.0884 4.55014L12.2643 6.08057C11.787 6.96692 10.897 7.55481 9.8945 7.64595L6.87882 7.92011C4.34575 8.15039 3.23057 11.2306 5.02911 13.0291Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  reorder: (
    <>
      <path
        d="M9 6.5C9 7.88071 7.88071 9 6.5 9C5.11929 9 4 7.88071 4 6.5C4 5.11929 5.11929 4 6.5 4C7.88071 4 9 5.11929 9 6.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 17.5C9 18.8807 7.88071 20 6.5 20C5.11929 20 4 18.8807 4 17.5C4 16.1193 5.11929 15 6.5 15C7.88071 15 9 16.1193 9 17.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 4.5L13.5 6.5L15.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 6.5H17C18.6569 6.5 20 7.84315 20 9.5V14.5C20 16.1569 18.6569 17.5 17 17.5H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
} as const;

export type GlyphName = keyof typeof GLYPHS;

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: GlyphName;
};

export function Glyph({ name, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      data-icon={name}
      {...props}
    >
      {GLYPHS[name]}
    </svg>
  );
}
