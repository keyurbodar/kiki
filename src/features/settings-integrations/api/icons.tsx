import type { ReactNode, SVGProps } from "react";
import type { IconId } from "@/primitives/icon";
import { Icon } from "@/primitives/icon";

/** Capy icon components missing from the sprite, copied from the production bundle. */
type IconProps = SVGProps<SVGSVGElement>;

export const PlusIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="plus-medium"
    {...props}
  >
    <path
      d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const RobotIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="robot"
    {...props}
  >
    <path
      d="M9 10C9 10.2761 8.77614 10.5 8.5 10.5C8.22386 10.5 8 10.2761 8 10M9 10C9 9.72386 8.77614 9.5 8.5 9.5C8.22386 9.5 8 9.72386 8 10M9 10H8M16 10C16 10.2761 15.7761 10.5 15.5 10.5C15.2239 10.5 15 10.2761 15 10M16 10C16 9.72386 15.7761 9.5 15.5 9.5C15.2239 9.5 15 9.72386 15 10M16 10H15M12 5V3M3.5 9C2.94772 9 2.5 9.44772 2.5 10C2.5 10.5523 2.94772 11 3.5 11M20.5 9C21.0523 9 21.5 9.44772 21.5 10C21.5 10.5523 21.0523 11 20.5 11M10 14.5H14M3.5 16V8C3.5 6.34315 4.84315 5 6.5 5H17.5C19.1569 5 20.5 6.34315 20.5 8V16C20.5 17.6569 19.1569 19 17.5 19H6.5C4.84315 19 3.5 17.6569 3.5 16Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="magnifying-glass"
    {...props}
  >
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

export const CrossIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="cross-medium"
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

export const ChevronDownSmallIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="chevron-down-small"
    {...props}
  >
    <path
      d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="arrow-up-right"
    {...props}
  >
    <path
      d="M18 15V6M18 6H9M18 6L6.25 17.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="square-behind-square-2"
    {...props}
  >
    <path
      d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckmarkIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="checkmark-1"
    {...props}
  >
    <path
      d="M5 12.75L10 19L19 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const HomeIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="home"
    {...props}
  >
    <path
      d="M4 10.2847C4 9.44537 4 9.02572 4.10594 8.63772C4.1998 8.29397 4.35414 7.9697 4.56174 7.68009C4.79607 7.3532 5.12176 7.08857 5.77316 6.55932L8.97316 3.95932C10.0521 3.08266 10.5916 2.64434 11.1913 2.47646C11.7203 2.3284 12.2797 2.3284 12.8087 2.47646C13.4084 2.64434 13.9479 3.08266 15.0268 3.95932L18.2268 6.55932C18.8782 7.08857 19.2039 7.3532 19.4383 7.68009C19.6459 7.9697 19.8002 8.29397 19.8941 8.63772C20 9.02572 20 9.44537 20 10.2847V15.2C20 16.8802 20 17.7202 19.673 18.362C19.3854 18.9265 18.9265 19.3854 18.362 19.673C17.7202 20 16.8802 20 15.2 20H8.8C7.11984 20 6.27976 20 5.63803 19.673C5.07354 19.3854 4.6146 18.9265 4.32698 18.362C4 17.7202 4 16.8802 4 15.2V10.2847Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const CompassIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="compass-round"
    {...props}
  >
    <path
      d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14.6558 8.73023L10.5513 9.84965C10.2097 9.94281 9.94281 10.2097 9.84965 10.5513L8.73023 14.6558C8.62843 15.0291 8.97092 15.3716 9.34417 15.2698L13.4487 14.1504C13.7903 14.0572 14.0572 13.7903 14.1504 13.4487L15.2698 9.34417C15.3716 8.97092 15.0291 8.62843 14.6558 8.73023Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="globe"
    {...props}
  >
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
  </svg>
);

export const TasksIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="tasks"
    {...props}
  >
    <path
      d="M17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 9.5L16 9.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14.5L16 14.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8.25" cy="9.5" r="1.25" fill="currentColor" />
    <circle cx="8.25" cy="14.5" r="1.25" fill="currentColor" />
  </svg>
);

export const ConsoleIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="console"
    {...props}
  >
    <path
      d="M7.5 8L9.25 9.75L7.5 11.5M12 11.5H14M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FilesIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="files"
    {...props}
  >
    <path
      d="M11 3H13.7574C14.553 3 15.3161 3.31607 15.8787 3.87868L19.1213 7.12132C19.6839 7.68393 20 8.44699 20 9.24264V15C20 16.6569 18.6569 18 17 18H11C9.34315 18 8 16.6569 8 15V6C8 4.34315 9.34315 3 11 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 18C17 19.6569 15.6569 21 14 21H8C6.34315 21 5 19.6569 5 18V9C5 7.34315 6.34315 6 8 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 3V6C15 7.10457 15.8954 8 17 8H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CodeIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="code"
    {...props}
  >
    <path
      d="M10 9.5L8.20711 11.2929C7.81658 11.6834 7.81658 12.3166 8.20711 12.7071L10 14.5M14 9.5L15.7929 11.2929C16.1834 11.6834 16.1834 12.3166 15.7929 12.7071L14 14.5M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PuzzleIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="puzzle"
    {...props}
  >
    <path
      d="M7 5H9.5V4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5V5H17C18.6569 5 20 6.34315 20 8V9.5H19.5C18.1193 9.5 17 10.6193 17 12C17 13.3807 18.1193 14.5 19.5 14.5H20V16C20 17.6569 18.6569 19 17 19H7C5.34315 19 4 17.6569 4 16V8C4 6.34315 5.34315 5 7 5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="round"
    />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="star"
    {...props}
  >
    <path
      d="M10.9907 2.63041C11.3958 1.78986 12.6042 1.78986 13.0093 2.63041L15.0244 6.81163C15.1874 7.14991 15.5122 7.38356 15.8875 7.43254L20.5265 8.038C21.4591 8.15972 21.8325 9.29762 21.1503 9.93882L17.7567 13.1284C17.4822 13.3865 17.3581 13.7645 17.427 14.1331L18.279 18.6885C18.4503 19.6043 17.4726 20.3075 16.6459 19.8633L12.5335 17.6533C12.2007 17.4745 11.7993 17.4745 11.4665 17.6533L7.35409 19.8633C6.52737 20.3075 5.54974 19.6043 5.72101 18.6885L6.57296 14.1331C6.64189 13.7645 6.51782 13.3865 6.24327 13.1284L2.84968 9.93882C2.16747 9.29762 2.54089 8.15972 3.47346 8.038L8.11245 7.43254C8.48776 7.38356 8.81257 7.14991 8.9756 6.81163L10.9907 2.63041Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Key1Icon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="key-1"
    {...props}
  >
    <path
      d="M20.8002 9.8753L20.0194 10.5L20.0194 10.5L20.8002 9.8753ZM22.0002 11.3753L21.2194 12V12L22.0002 11.3753ZM22.0002 12.6247L21.2194 12V12L22.0002 12.6247ZM20.8002 14.1247L20.0194 13.5L20.0194 13.5L20.8002 14.1247ZM18 14.5L17.5528 15.3944C17.6916 15.4639 17.8448 15.5 18 15.5V14.5ZM16 13.5L16.4472 12.6056C16.1657 12.4648 15.8343 12.4648 15.5528 12.6056L16 13.5ZM14 14.5V15.5C14.1552 15.5 14.3084 15.4639 14.4472 15.3944L14 14.5ZM11.0141 9.01843L11.8165 8.42152L11.8165 8.42152L11.0141 9.01843ZM11.0141 14.9816L10.2118 14.3847V14.3847L11.0141 14.9816ZM6.5 12C6.5 11.7239 6.72386 11.5 7 11.5V13.5C7.82843 13.5 8.5 12.8284 8.5 12H6.5ZM7 11.5C7.27614 11.5 7.5 11.7239 7.5 12H5.5C5.5 12.8284 6.17157 13.5 7 13.5V11.5ZM7.5 12C7.5 12.2761 7.27614 12.5 7 12.5V10.5C6.17157 10.5 5.5 11.1716 5.5 12H7.5ZM7 12.5C6.72386 12.5 6.5 12.2761 6.5 12H8.5C8.5 11.1716 7.82843 10.5 7 10.5V12.5ZM6.5 13H7.5V11H6.5V13ZM7 16C4.79086 16 3 14.2091 3 12H1C1 15.3137 3.68629 18 7 18V16ZM3 12C3 9.79086 4.79086 8 7 8V6C3.68629 6 1 8.68629 1 12H3ZM20.0194 10.5L21.2194 12L22.7811 10.7506L21.5811 9.25061L20.0194 10.5ZM21.2194 12L20.0194 13.5L21.5811 14.7494L22.7811 13.2494L21.2194 12ZM20.0194 13.5H18V15.5H20.0194V13.5ZM18.4472 13.6056L16.4472 12.6056L15.5528 14.3944L17.5528 15.3944L18.4472 13.6056ZM15.5528 12.6056L13.5528 13.6056L14.4472 15.3944L16.4472 14.3944L15.5528 12.6056ZM11.9079 10.5H20.0194V8.5H11.9079V10.5ZM7 8C8.31459 8 9.48107 8.63311 10.2118 9.61533L11.8165 8.42152C10.7246 6.9539 8.97356 6 7 6V8ZM14 13.5H11.9079V15.5H14V13.5ZM10.2118 14.3847C9.48107 15.3669 8.31459 16 7 16V18C8.97356 18 10.7246 17.0461 11.8165 15.5785L10.2118 14.3847ZM11.9079 13.5C11.1751 13.5 10.5749 13.8967 10.2118 14.3847L11.8165 15.5785C11.8445 15.5408 11.8734 15.5183 11.8929 15.5074C11.9106 15.4976 11.9148 15.5 11.9079 15.5V13.5ZM20.0194 13.5L20.0194 13.5V15.5C20.6269 15.5 21.2016 15.2238 21.5811 14.7494L20.0194 13.5ZM11.9079 8.5C11.9148 8.5 11.9106 8.50239 11.8929 8.49258C11.8734 8.48172 11.8445 8.45923 11.8165 8.42152L10.2118 9.61533C10.5749 10.1033 11.1751 10.5 11.9079 10.5V8.5ZM21.2194 12V12L22.7811 13.2494C23.3655 12.519 23.3655 11.481 22.7811 10.7506L21.2194 12ZM21.5811 9.25061C21.2016 8.77618 20.6269 8.5 20.0194 8.5V10.5L20.0194 10.5L21.5811 9.25061Z"
      fill="currentColor"
    />
  </svg>
);

export const BellIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="bell"
    {...props}
  >
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

export const PeopleIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="people"
    {...props}
  >
    <path
      d="M15.5 6.5C15.5 8.433 13.933 10 12 10C10.067 10 8.5 8.433 8.5 6.5C8.5 4.567 10.067 3 12 3C13.933 3 15.5 4.567 15.5 6.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M11.9997 13C9.02123 13 6.67402 14.5539 5.43304 16.8621C4.59593 18.4191 6.02717 20 7.79494 20H16.2044C17.9722 20 19.4034 18.4191 18.5663 16.8621C17.3254 14.5539 14.9781 13 11.9997 13Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="shield"
    {...props}
  >
    <path
      d="M20 7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123V7.17737Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChartIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="chart-1"
    {...props}
  >
    <path
      d="M21 15V7C21 5.34315 19.6569 4 18 4H6C4.34315 4 3 5.34315 3 7V15C3 16.6569 4.34315 18 6 18H18C19.6569 18 21 16.6569 21 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 13V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 11V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.1445 18.5L16.0017 21.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.85714 18.5L8 21.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-icon="clock"
    {...props}
  >
    <path
      d="M12 8V12L14.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const spriteIcon = (name: IconId) => (props: IconProps) => (
  <Icon name={name} className={props.className} />
);

const projectIcons: Record<string, (props: IconProps) => ReactNode> = {
  home: HomeIcon,
  compass: CompassIcon,
  globe: GlobeIcon,
  task: TasksIcon,
  console: ConsoleIcon,
  files: FilesIcon,
  folder: spriteIcon("folder-1"),
  code: CodeIcon,
  puzzle: PuzzleIcon,
  star: StarIcon,
  key: Key1Icon,
  bell: BellIcon,
  people: PeopleIcon,
  shield: ShieldIcon,
  chart: ChartIcon,
  clock: ClockIcon,
  pin: spriteIcon("pin"),
  search: SearchIcon,
};

/**
 * Capy's ProjectIcon (`icon: null` → robot). Named icons render the glyph;
 * anything else is an emoji.
 */
export function ProjectIcon({
  icon,
  className,
}: {
  icon: string | null;
  className?: string;
}) {
  if (icon === null) return <RobotIcon className={className} />;
  const Glyph = projectIcons[icon];
  if (Glyph === undefined) return <span className={className}>{icon}</span>;
  return <Glyph className={className} />;
}

export const ApiKeyIcon = (props: IconProps) => (
  <Icon name="key-2" className={props.className} />
);
