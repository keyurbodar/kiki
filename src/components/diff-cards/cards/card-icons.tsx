import type { ReactNode, SVGProps } from "react";

const paths = {
  "pull-request": (
    <>
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
    </>
  ),
  merged: (
    <>
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
        d="M8 6H15C16.6569 6 18 7.34315 18 9V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  draft: (
    <>
      <circle
        cx="6.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "request-closed": (
    <>
      <circle
        cx="6.5"
        cy="6"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 11V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "shield-crossed": (
    <>
      <path
        d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  globe: (
    <>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M21 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </>
  ),
  console: (
    <>
      <path
        d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "cross-medium": (
    <>
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  "bubble-question": (
    <>
      <path
        d="M12.0218 11.6633C12.1234 10.9868 12.5019 10.6214 12.8813 10.3636C13.2524 10.1113 13.6234 9.78387 13.6234 9.17768C13.6234 8.34097 12.9522 7.66333 12.1234 7.66333C11.2946 7.66333 10.6234 8.34097 10.6234 9.17768M11.9977 20.5358L14.7377 18.2657C14.9171 18.1171 15.1427 18.0358 15.3757 18.0358L17.002 18.0358C18.6588 18.0358 20.002 16.6926 20.002 15.0358V7C20.002 5.34314 18.6588 4 17.0019 4L7.00195 4.00002C5.3451 4.00002 4.00195 5.34317 4.00195 7.00002V15.0358C4.00195 16.6926 5.3451 18.0358 7.00195 18.0358H8.65157C8.8865 18.0358 9.11393 18.1185 9.29398 18.2694L11.9977 20.5358Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13.625C12.4832 13.625 12.875 14.0168 12.875 14.5C12.875 14.9832 12.4832 15.375 12 15.375C11.5168 15.375 11.125 14.9832 11.125 14.5C11.125 14.0168 11.5168 13.625 12 13.625Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.75"
      />
    </>
  ),
  "chevron-right-small": (
    <>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "square-arrow-top-right": (
    <>
      <path
        d="M9 6H8.8C7.11984 6 6.27976 6 5.63803 6.32698C5.07354 6.6146 4.6146 7.07354 4.32698 7.63803C4 8.27976 4 9.11984 4 10.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H13.2C14.8802 20 15.7202 20 16.362 19.673C16.9265 19.3854 17.3854 18.9265 17.673 18.362C18 17.7202 18 16.8802 18 15.2V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4H20M20 4V10M20 4L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "arrow-up-right": (
    <>
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "calendar-clock": (
    <>
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
    </>
  ),
} satisfies Record<string, ReactNode>;

export type CardIconName = keyof typeof paths;

export type CardIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: CardIconName;
};

export function CardIcon({ name, ...props }: CardIconProps) {
  return (
    <svg
      data-slot="icon"
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
