import type { SVGProps } from "react";

export type SidebarIconProps = SVGProps<SVGSVGElement>;

function SidebarIcon({ children, ...props }: SidebarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      {...props}
    >
      {children}
    </svg>
  );
}

export function EditSmallIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="edit-small-1" {...props}>
      <path
        d="M11 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 11V7.99998L17.5 3.49998C18.3284 2.67156 19.6716 2.67156 20.5 3.49998C21.3284 4.32841 21.3284 5.67155 20.5 6.49998L16 11H13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SidebarIcon>
  );
}

export function CircleDashedIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="circle-dashed" {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
      />
    </SidebarIcon>
  );
}

export function PullRequestIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="pull-request" {...props}>
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
    </SidebarIcon>
  );
}

export function CalendarClockIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="calendar-clock" {...props}>
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
    </SidebarIcon>
  );
}

export function CompassRoundIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="compass-round" {...props}>
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
    </SidebarIcon>
  );
}

export function FilesIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="files" {...props}>
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
    </SidebarIcon>
  );
}

export function ListBulletsIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="list-bullets" {...props}>
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
    </SidebarIcon>
  );
}

export function DotGrid1x3HorizontalIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="dot-grid-1x3-horizontal" {...props}>
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
    </SidebarIcon>
  );
}

export function SettingsSliderThreeIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="settings-slider-three" {...props}>
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
    </SidebarIcon>
  );
}

export function Checkmark1Icon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="checkmark-1" {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SidebarIcon>
  );
}

export function MagnifyingGlassIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="magnifying-glass" {...props}>
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
    </SidebarIcon>
  );
}

export function ShipIcon(props: SidebarIconProps) {
  return (
    <SidebarIcon data-icon="ship" {...props}>
      <path
        d="M6 12V8C6 7.44772 6.44772 7 7 7H17C17.5523 7 18 7.44772 18 8V12M3 20L6.41857 19.2403M6.41857 19.2403L6.84921 19.1446C7.27784 19.0494 7.72216 19.0494 8.15079 19.1446L11.3492 19.8554C11.7778 19.9506 12.2222 19.9506 12.6508 19.8554L15.8492 19.1446C16.2778 19.0494 16.7222 19.0494 17.1508 19.1446L17.5814 19.2403M6.41857 19.2403C5.48385 17.9577 4.90622 16.8218 4.52949 15.6017C4.08185 14.1519 5.10707 12.7232 6.57904 12.3552L11.2724 11.1819C11.7501 11.0625 12.2499 11.0625 12.7276 11.1819L17.421 12.3552C18.8929 12.7232 19.9181 14.1519 19.4705 15.6017C19.0938 16.8218 18.5162 17.9577 17.5814 19.2403M17.5814 19.2403L21 20M10 7V3H14V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SidebarIcon>
  );
}
