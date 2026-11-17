import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" {...props}>
      {children}
    </svg>
  );
}

export function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
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
    </Glyph>
  );
}

export function FilterGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M17.1716 4H6.82843C5.26633 4 4 5.26633 4 6.82843C4 7.57857 4.29799 8.29799 4.82843 8.82843L9.12132 13.1213C9.68393 13.6839 10 14.447 10 15.2426V20.057C10 20.7552 10.6974 21.2385 11.3511 20.9933L13.3511 20.2433C13.7414 20.097 14 19.7238 14 19.307V15.2426C14 14.447 14.3161 13.6839 14.8787 13.1213L19.1716 8.82843C19.702 8.29799 20 7.57857 20 6.82843C20 5.26633 18.7337 4 17.1716 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function RefreshGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
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
    </Glyph>
  );
}

export function CopyGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M15 9V5.25C15 4.00736 13.9926 3 12.75 3H5.25C4.00736 3 3 4.00736 3 5.25V12.75C3 13.9926 4.00736 15 5.25 15H9M11.25 9H18.75C19.9926 9 21 10.0074 21 11.25V18.75C21 19.9926 19.9926 21 18.75 21H11.25C10.0074 21 9 19.9926 9 18.75V11.25C9 10.0074 10.0074 9 11.25 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function ChatGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6.00195 4H18.002C19.6588 4 21.002 5.34315 21.002 7V15C21.002 16.6569 19.6588 18 18.002 18H12.002L7.00195 21V18H6.00195C4.3451 18 3.00195 16.6569 3.00195 15V7C3.00195 5.34315 4.3451 4 6.00195 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function FoldersGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M2 11V17C2 18.6569 3.34315 20 5 20H15C16.6569 20 18 18.6569 18 17V13C18 11.3431 16.6569 10 15 10H10.8284C10.298 10 9.78929 9.78929 9.41421 9.41421L8.58579 8.58579C8.21071 8.21071 7.70201 8 7.17157 8H5C3.34315 8 2 9.34315 2 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 16H19C20.6569 16 22 14.6569 22 13V9C22 7.34315 20.6569 6 19 6H14.8284C14.298 6 13.7893 5.78929 13.4142 5.41421L12.5858 4.58579C12.2107 4.21071 11.702 4 11.1716 4H9C7.34315 4 6 5.34315 6 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function FolderFilledGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6 3C3.79086 3 2 4.79086 2 7V16C2 18.2091 3.79086 20 6 20H18C20.2091 20 22 18.2091 22 16V10C22 7.79086 20.2091 6 18 6H13.0704C12.736 6 12.4238 5.8329 12.2383 5.5547L11.4258 4.3359C10.8694 3.5013 9.93269 3 8.92963 3H6Z"
        fill="currentColor"
      />
    </Glyph>
  );
}

export function PaperclipGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M6 11V15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15V7C18 4.79086 16.2091 3 14 3C11.7909 3 10 4.79086 10 7V15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function LaptopGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M2 16H22V17.5C22 18.8807 20.8807 20 19.5 20H4.5C3.11929 20 2 18.8807 2 17.5V16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M20 15.75V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V15.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CloudGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M7 19C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function GithubGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M12 1.95068C17.525 1.95068 22 6.42568 22 11.9507C21.9995 14.0459 21.3419 16.0883 20.1198 17.7902C18.8977 19.4922 17.1727 20.768 15.1875 21.4382C14.6875 21.5382 14.5 21.2257 14.5 20.9632C14.5 20.6257 14.5125 19.5507 14.5125 18.2132C14.5125 17.2757 14.2 16.6757 13.8375 16.3632C16.0625 16.1132 18.4 15.2632 18.4 11.4257C18.4 10.3257 18.0125 9.43818 17.375 8.73818C17.475 8.48818 17.825 7.46318 17.275 6.08818C17.275 6.08818 16.4375 5.81318 14.525 7.11318C13.725 6.88818 12.875 6.77568 12.025 6.77568C11.175 6.77568 10.325 6.88818 9.525 7.11318C7.6125 5.82568 6.775 6.08818 6.775 6.08818C6.225 7.46318 6.575 8.48818 6.675 8.73818C6.0375 9.43818 5.65 10.3382 5.65 11.4257C5.65 15.2507 7.975 16.1132 10.2 16.3632C9.9125 16.6132 9.65 17.0507 9.5625 17.7007C8.9875 17.9632 7.55 18.3882 6.65 16.8757C6.4625 16.5757 5.9 15.8382 5.1125 15.8507C4.275 15.8632 4.775 16.3257 5.125 16.5132C5.55 16.7507 6.0375 17.6382 6.15 17.9257C6.35 18.4882 7 19.5632 9.5125 19.1007C9.5125 19.9382 9.525 20.7257 9.525 20.9632C9.525 21.2257 9.3375 21.5257 8.8375 21.4382C6.8458 20.7752 5.11342 19.502 3.88611 17.799C2.65881 16.096 1.9989 14.0498 2 11.9507C2 6.42568 6.475 1.95068 12 1.95068Z"
        fill="currentColor"
      />
    </Glyph>
  );
}

export function UserGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
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
    </Glyph>
  );
}

export function BuildingsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 9H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13H10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 19V7C14 5.34315 12.6569 4 11 4H7C5.34315 4 4 5.34315 4 7V19"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 19V11C20 9.34315 18.6569 8 17 8H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 19H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function BoxGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}

export function CalendarClockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        d="M2.75879 10.1637L3.62703 15.0877C3.91474 16.7194 5.47072 17.8089 7.1024 17.5212L10.0972 16.9931M2.75879 10.1637L2.58514 9.17888C2.29743 7.5472 3.38694 5.99122 5.01862 5.70351L11.9123 4.48797C13.544 4.20026 15.0999 5.28977 15.3876 6.92145C15.4835 7.46535 15.1204 7.984 14.5765 8.07991L2.75879 10.1637Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20C19.3137 20 22 17.3137 22 14C22 10.6863 19.3137 8 16 8C12.6863 8 10 10.6863 10 14C10 17.3137 12.6863 20 16 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 12V14L17.6667 15.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Glyph>
  );
}
