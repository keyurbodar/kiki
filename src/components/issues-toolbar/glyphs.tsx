/* Capy icon glyphs read from Capy's DOM; the shipped sprite lacks these ids. */
import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

export function SearchGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
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
    </svg>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FilterGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17.1716 4H6.82843C5.26633 4 4 5.26633 4 6.82843C4 7.57857 4.29799 8.29799 4.82843 8.82843L9.12132 13.1213C9.68393 13.6839 10 14.447 10 15.2426V20.057C10 20.7552 10.6974 21.2385 11.3511 20.9933L13.3511 20.2433C13.7414 20.097 14 19.7238 14 19.307V15.2426C14 14.447 14.3161 13.6839 14.8787 13.1213L19.1716 8.82843C19.702 8.29799 20 7.57857 20 6.82843C20 5.26633 18.7337 4 17.1716 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DisplayGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.95117 20.004V14.0015"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.95117 9.99999V3.99707"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.0038V13.0005"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.99915V3.99707"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0488 20.0036V16.002"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0488 12.0008V3.99707"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0449 8.99902H13.9553"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.0938 16.002H20.0041"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.99609 14.0015H7.90643"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.75 20C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12C15.5713 12 17.8774 14.1946 18.797 17.0463C19.3055 18.6232 17.9069 20 16.25 20H7.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7.75"
        r="4.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonEditGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 20H7.75C6.09315 20 4.69455 18.6232 5.20302 17.0463C6.12257 14.1946 8.42872 12 12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7.75"
        r="4.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 20V17.9142C14 17.649 14.1054 17.3946 14.2929 17.2071L17.75 13.75C18.4404 13.0596 19.5596 13.0596 20.25 13.75C20.9404 14.4404 20.9404 15.5596 20.25 16.25L17.0858 19.4142C16.7107 19.7893 16.202 20 15.6716 20H14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrownGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.00247 16.6119L2 7L8 10L12 4L16 10L22 7L19.9975 16.6119C19.7077 18.003 18.4816 19 17.0606 19H6.93941C5.51839 19 4.2923 18.003 4.00247 16.6119Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.00195 4H18.002C19.6588 4 21.002 5.34315 21.002 7V15C21.002 16.6569 19.6588 18 18.002 18H12.002L7.00195 21V18H6.00195C4.3451 18 3.00195 16.6569 3.00195 15V7C3.00195 5.34315 4.3451 4 6.00195 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 18.25C15.4518 18.25 18.25 15.4518 18.25 12C18.25 8.54822 15.4518 5.75 12 5.75V18.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FlagGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 15V4C5 3.44772 5.44772 3 6 3H19.1315C19.9302 3 20.4066 3.89015 19.9635 4.5547L17.3698 8.4453C17.1459 8.7812 17.1459 9.2188 17.3698 9.5547L19.9635 13.4453C20.4066 14.1099 19.9302 15 19.1315 15H5ZM5 15V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 5V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 5V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AtGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16.7368 19.6541C15.361 20.5073 13.738 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 13.9262 20.0428 15.9154 17.8101 15.7125C15.9733 15.5455 14.6512 13.8737 14.9121 12.0479L15.4274 8.5M14.8581 12.4675C14.559 14.596 12.8066 16.1093 10.9442 15.8476C9.08175 15.5858 7.81444 13.6481 8.11358 11.5196C8.41272 9.39109 10.165 7.87778 12.0275 8.13953C13.8899 8.40128 15.1573 10.339 14.8581 12.4675Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.58073 9.43467C5.10819 5.74248 8.2703 3 12 3C15.7296 3 18.8918 5.74248 19.4192 9.43467L20.0108 13.5757C20.269 15.383 18.8666 17 17.0409 17H6.959C5.13335 17 3.73096 15.383 3.98915 13.5757L4.58073 9.43467Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17C16 19.2091 14.2091 21 12 21C9.79086 21 8 19.2091 8 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProjectGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TagGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5C7 7.22386 7.22386 7 7.5 7C7.77614 7 8 7.22386 8 7.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M3 10.7574V6C3 4.34315 4.34315 3 6 3H10.7574C11.553 3 12.3161 3.31607 12.8787 3.87868L20.1287 11.1287C21.3003 12.3003 21.3003 14.1997 20.1287 15.3713L15.3713 20.1287C14.1997 21.3003 12.3003 21.3003 11.1287 20.1287L3.87868 12.8787C3.31607 12.3161 3 11.553 3 10.7574Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M7.39844 7.5H7.59844"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13 18L11.6213 19.3787C10.4497 20.5503 8.55023 20.5503 7.37866 19.3787L4.62129 16.6213C3.44972 15.4497 3.44972 13.5503 4.62129 12.3787L5.99997 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 5.99955L12.3787 4.62087C13.5503 3.44929 15.4497 3.44929 16.6213 4.62087L19.3787 7.37823C20.5503 8.5498 20.5503 10.4493 19.3787 11.6209L18 12.9995"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15L15 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PullRequestGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle
        cx="6"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6H15C16.6569 6 18 7.34315 18 9V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4L12 6L14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeOffGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.7424 5.08581C14.5545 4.56441 18.5221 6.42082 21.2263 10.6551C21.7501 11.4753 21.7503 12.5244 21.2265 13.3446C20.932 13.8057 20.6226 14.2386 20.3 14.6434"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.70711 2.29289C3.31658 1.90237 2.68342 1.90237 2.29289 2.29289C1.90237 2.68342 1.90237 3.31658 2.29289 3.70711L3.70711 2.29289ZM20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L20.2929 21.7071ZM2.29289 3.70711L20.2929 21.7071L21.7071 20.2929L3.70711 2.29289L2.29289 3.70711Z"
        fill="currentColor"
      />
      <path
        d="M10.3327 10.8948C10.6385 10.4349 10.5136 9.81418 10.0537 9.50839C9.59377 9.20261 8.97305 9.32755 8.66727 9.78745L10.3327 10.8948ZM14.2126 15.3328C14.6725 15.027 14.7974 14.4063 14.4916 13.9463C14.1858 13.4864 13.5651 13.3615 13.1052 13.6673L14.2126 15.3328ZM12 14C10.8954 14 10 13.1046 10 12H8C8 14.2092 9.79086 16 12 16V14ZM10 12C10 11.5897 10.1225 11.211 10.3327 10.8948L8.66727 9.78745C8.24565 10.4216 8 11.1836 8 12H10ZM13.1052 13.6673C12.789 13.8775 12.4103 14 12 14V16C12.8164 16 13.5785 15.7544 14.2126 15.3328L13.1052 13.6673Z"
        fill="currentColor"
      />
      <path
        d="M6.12804 7C4.8897 7.90878 3.74923 9.12726 2.77333 10.6554C2.24952 11.4757 2.25027 12.5258 2.77416 13.346C6.35039 18.9448 12.1359 20.3855 16.8491 17.6681"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

