import type { SVGProps } from "react";

/**
 * Icons Capy draws inline on its drive screens, copied path for path from the
 * captured DOM. They are not in the shared sprite yet; move them there when the
 * assets package adds them.
 */
type DriveIconProps = SVGProps<SVGSVGElement>;

export function SearchIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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

export function ShareIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8 6L12 2L16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 10C18.1046 10 19 10.8954 19 12V17C19 18.6569 17.6569 20 16 20H8C6.34315 20 5 18.6569 5 17V12C5 10.8954 5.89543 10 7 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlidersIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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

export function InboxIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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

export function BuildingIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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
    </svg>
  );
}

export function UserIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
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

export function SparkleIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 12.5C14.75 12.5 12 15.4028 12 22C12 15.4028 9.25 12.5 3 12.5C9.25 12.5 12 9.59722 12 3C12 9.59722 14.75 12.5 21 12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DocumentIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9 6C8.44772 6 8 6.44772 8 7C8 7.55228 8.44772 8 9 8V6ZM15 8C15.5523 8 16 7.55228 16 7C16 6.44772 15.5523 6 15 6V8ZM9 10C8.44772 10 8 10.4477 8 11C8 11.5523 8.44772 12 9 12V10ZM12 12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10V12ZM7 4H16V2H7V4ZM18 6V18H20V6H18ZM16 20H7V22H16V20ZM6 19V5H4V19H6ZM7 20C6.44771 20 6 19.5523 6 19H4C4 20.6569 5.34315 22 7 22V20ZM18 18C18 19.1046 17.1046 20 16 20V22C18.2091 22 20 20.2091 20 18H18ZM16 4C17.1046 4 18 4.89543 18 6H20C20 3.79086 18.2091 2 16 2V4ZM7 2C5.34315 2 4 3.34315 4 5H6C6 4.44772 6.44772 4 7 4V2ZM18 12V14H20V12H18ZM16 16H7V18H16V16ZM7 22H10V20H7V22ZM7 16C5.34315 16 4 17.3431 4 19H6C6 18.4477 6.44772 18 7 18V16ZM18 14C18 15.1046 17.1046 16 16 16V18C18.2091 18 20 16.2091 20 14H18ZM9 8H15V6H9V8ZM9 12H12V10H9V12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function UploadIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 9V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5H7C9.76142 5 12 7.23858 12 10V15M12 15L15.75 11.25M12 15L8.25 11.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExpandAllIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M13 9.00022C13 8.44793 12.5523 8.00022 12 8.00021C11.4478 8.00021 11 8.44792 11 9.00021L13 9.00022ZM11 15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15L11 15ZM15 13.0002C15.5523 13.0002 16 12.5525 16 12.0003C16.0001 11.448 15.5524 11.0002 15.0001 11.0002L15 13.0002ZM9.00005 11C8.44777 11 8.00004 11.4477 8.00002 11.9999C7.99999 12.5522 8.44769 13 8.99998 13L9.00005 11ZM5.63803 19.673L6.09202 18.782H6.09202L5.63803 19.673ZM4.32698 18.362L3.43597 18.816H3.43597L4.32698 18.362ZM19.673 18.362L18.782 17.908V17.908L19.673 18.362ZM18.362 19.673L17.908 18.782H17.908L18.362 19.673ZM19.673 5.63803L18.782 6.09202V6.09202L19.673 5.63803ZM18.362 4.32698L18.816 3.43597V3.43597L18.362 4.32698ZM4.32698 5.63803L5.21799 6.09202L4.32698 5.63803ZM5.63803 4.32698L6.09202 5.21799L5.63803 4.32698ZM11 9.00021L11 15L13 15L13 9.00022L11 9.00021ZM15.0001 11.0002L9.00005 11L8.99998 13L15 13.0002L15.0001 11.0002ZM19 8.8V15.2H21V8.8H19ZM15.2 19H8.8V21H15.2V19ZM5 15.2V8.8H3V15.2H5ZM8.8 5H15.2V3H8.8V5ZM8.8 19C7.94342 19 7.36113 18.9992 6.91104 18.9624C6.47262 18.9266 6.24842 18.8617 6.09202 18.782L5.18404 20.564C5.66937 20.8113 6.18608 20.9099 6.74817 20.9558C7.2986 21.0008 7.97642 21 8.8 21V19ZM3 15.2C3 16.0236 2.99922 16.7014 3.04419 17.2518C3.09012 17.8139 3.18868 18.3306 3.43597 18.816L5.21799 17.908C5.1383 17.7516 5.07337 17.5274 5.03755 17.089C5.00078 16.6389 5 16.0566 5 15.2H3ZM6.09202 18.782C5.7157 18.5903 5.40973 18.2843 5.21799 17.908L3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564L6.09202 18.782ZM19 15.2C19 16.0566 18.9992 16.6389 18.9624 17.089C18.9266 17.5274 18.8617 17.7516 18.782 17.908L20.564 18.816C20.8113 18.3306 20.9099 17.8139 20.9558 17.2518C21.0008 16.7014 21 16.0236 21 15.2H19ZM15.2 21C16.0236 21 16.7014 21.0008 17.2518 20.9558C17.8139 20.9099 18.3306 20.8113 18.816 20.564L17.908 18.782C17.7516 18.8617 17.5274 18.9266 17.089 18.9624C16.6389 18.9992 16.0566 19 15.2 19V21ZM18.782 17.908C18.5903 18.2843 18.2843 18.5903 17.908 18.782L18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816L18.782 17.908ZM21 8.8C21 7.97642 21.0008 7.2986 20.9558 6.74817C20.9099 6.18608 20.8113 5.66937 20.564 5.18404L18.782 6.09202C18.8617 6.24842 18.9266 6.47262 18.9624 6.91104C18.9992 7.36113 19 7.94342 19 8.8H21ZM15.2 5C16.0566 5 16.6389 5.00078 17.089 5.03755C17.5274 5.07337 17.7516 5.1383 17.908 5.21799L18.816 3.43597C18.3306 3.18868 17.8139 3.09012 17.2518 3.04419C16.7014 2.99922 16.0236 3 15.2 3V5ZM20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597L17.908 5.21799C18.2843 5.40973 18.5903 5.7157 18.782 6.09202L20.564 5.18404ZM5 8.8C5 7.94342 5.00078 7.36113 5.03755 6.91104C5.07337 6.47262 5.1383 6.24842 5.21799 6.09202L3.43597 5.18404C3.18868 5.66937 3.09012 6.18608 3.04419 6.74817C2.99922 7.2986 3 7.97642 3 8.8H5ZM8.8 3C7.97642 3 7.2986 2.99922 6.74817 3.04419C6.18608 3.09012 5.66937 3.18868 5.18404 3.43597L6.09202 5.21799C6.24842 5.1383 6.47262 5.07337 6.91104 5.03755C7.36113 5.00078 7.94342 5 8.8 5V3ZM5.21799 6.09202C5.40973 5.71569 5.71569 5.40973 6.09202 5.21799L5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404L5.21799 6.09202Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CollapseAllIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M15 13.0002C15.5523 13.0002 16 12.5525 16 12.0003C16.0001 11.448 15.5524 11.0002 15.0001 11.0002L15 13.0002ZM9.00005 11C8.44777 11 8.00004 11.4477 8.00002 11.9999C7.99999 12.5522 8.44769 13 8.99998 13L9.00005 11ZM5.63803 19.673L6.09202 18.782H6.09202L5.63803 19.673ZM4.32698 18.362L3.43597 18.816H3.43597L4.32698 18.362ZM19.673 18.362L18.782 17.908V17.908L19.673 18.362ZM18.362 19.673L17.908 18.782H17.908L18.362 19.673ZM19.673 5.63803L18.782 6.09202V6.09202L19.673 5.63803ZM18.362 4.32698L18.816 3.43597V3.43597L18.362 4.32698ZM4.32698 5.63803L5.21799 6.09202L4.32698 5.63803ZM5.63803 4.32698L6.09202 5.21799L5.63803 4.32698ZM15.0001 11.0002L9.00005 11L8.99998 13L15 13.0002L15.0001 11.0002ZM19 8.8V15.2H21V8.8H19ZM15.2 19H8.8V21H15.2V19ZM5 15.2V8.8H3V15.2H5ZM8.8 5H15.2V3H8.8V5ZM8.8 19C7.94342 19 7.36113 18.9992 6.91104 18.9624C6.47262 18.9266 6.24842 18.8617 6.09202 18.782L5.18404 20.564C5.66937 20.8113 6.18608 20.9099 6.74817 20.9558C7.2986 21.0008 7.97642 21 8.8 21V19ZM3 15.2C3 16.0236 2.99922 16.7014 3.04419 17.2518C3.09012 17.8139 3.18868 18.3306 3.43597 18.816L5.21799 17.908C5.1383 17.7516 5.07337 17.5274 5.03755 17.089C5.00078 16.6389 5 16.0566 5 15.2H3ZM6.09202 18.782C5.7157 18.5903 5.40973 18.2843 5.21799 17.908L3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564L6.09202 18.782ZM19 15.2C19 16.0566 18.9992 16.6389 18.9624 17.089C18.9266 17.5274 18.8617 17.7516 18.782 17.908L20.564 18.816C20.8113 18.3306 20.9099 17.8139 20.9558 17.2518C21.0008 16.7014 21 16.0236 21 15.2H19ZM15.2 21C16.0236 21 16.7014 21.0008 17.2518 20.9558C17.8139 20.9099 18.3306 20.8113 18.816 20.564L17.908 18.782C17.7516 18.8617 17.5274 18.9266 17.089 18.9624C16.6389 18.9992 16.0566 19 15.2 19V21ZM18.782 17.908C18.5903 18.2843 18.2843 18.5903 17.908 18.782L18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816L18.782 17.908ZM21 8.8C21 7.97642 21.0008 7.2986 20.9558 6.74817C20.9099 6.18608 20.8113 5.66937 20.564 5.18404L18.782 6.09202C18.8617 6.24842 18.9266 6.47262 18.9624 6.91104C18.9992 7.36113 19 7.94342 19 8.8H21ZM15.2 5C16.0566 5 16.6389 5.00078 17.089 5.03755C17.5274 5.07337 17.7516 5.1383 17.908 5.21799L18.816 3.43597C18.3306 3.18868 17.8139 3.09012 17.2518 3.04419C16.7014 2.99922 16.0236 3 15.2 3V5ZM20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597L17.908 5.21799C18.2843 5.40973 18.5903 5.7157 18.782 6.09202L20.564 5.18404ZM5 8.8C5 7.94342 5.00078 7.36113 5.03755 6.91104C5.07337 6.47262 5.1383 6.24842 5.21799 6.09202L3.43597 5.18404C3.18868 5.66937 3.09012 6.18608 3.04419 6.74817C2.99922 7.2986 3 7.97642 3 8.8H5ZM8.8 3C7.97642 3 7.2986 2.99922 6.74817 3.04419C6.18608 3.09012 5.66937 3.18868 5.18404 3.43597L6.09202 5.21799C6.24842 5.1383 6.47262 5.07337 6.91104 5.03755C7.36113 5.00078 7.94342 5 8.8 5V3ZM5.21799 6.09202C5.40973 5.71569 5.71569 5.40973 6.09202 5.21799L5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404L5.21799 6.09202Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlusIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HistoryIcon(props: DriveIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 5V9H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51172 15C4.74723 18.4956 8.08094 21 11.9996 21C16.9702 21 20.9996 16.9706 20.9996 12C20.9996 7.02944 16.9702 3 11.9996 3C8.27045 3 5.07102 5.26806 3.70551 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
