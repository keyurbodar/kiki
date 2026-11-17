import type { ReactNode, SVGProps } from "react";

export type AuditIconProps = SVGProps<SVGSVGElement>;

function AuditIcon({
  name,
  children,
  ...props
}: AuditIconProps & { name: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      data-icon={name}
      {...props}
    >
      {children}
    </svg>
  );
}

export function AgentFlowIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="agent-flow" {...props}>
      <circle cx="12" cy="6" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8.5V12M12 12H9C7.34315 12 6 13.3431 6 15V15.5M12 12H15C16.6569 12 18 13.3431 18 15V15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ArrowDownIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="arrow-down" {...props}>
      <path
        d="M18 14L12 20L6 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function Box2Icon(props: AuditIconProps) {
  return (
    <AuditIcon name="box-2" {...props}>
      <path
        d="M4.00001 13L4 17C3.99999 18.6569 5.34314 20 7 20H17C18.6569 20 20 18.6569 20 17V13M4.00001 13L4.00003 7C4.00004 5.34315 5.34318 4.00001 7.00003 4L17 4C18.6569 4 20 5.34315 20 7V13M4.00001 13H8.12601C8.57005 14.7252 10.1362 16 12 16C13.8638 16 15.4299 14.7252 15.874 13H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function BubbleWideIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="bubble-wide" {...props}>
      <path
        d="M3.00195 7.00002C3.00195 5.34317 4.3451 4.00002 6.00195 4.00002L18.0019 4C19.6588 4 21.002 5.34314 21.002 7V15.0358C21.002 16.6926 19.6588 18.0357 18.002 18.0358L15.3757 18.0358C15.1427 18.0358 14.9171 18.1171 14.7377 18.2657L11.9977 20.5358L9.29398 18.2694C9.11393 18.1185 8.8865 18.0358 8.65157 18.0358H6.00195C4.3451 18.0358 3.00195 16.6926 3.00195 15.0358L3.00195 7.00002Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function BuildingsIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="buildings" {...props}>
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
    </AuditIcon>
  );
}

export function Calendar4Icon(props: AuditIconProps) {
  return (
    <AuditIcon name="calendar-4" {...props}>
      <path
        d="M4 8C4 6.34315 5.34315 5 7 5H17C18.6569 5 20 6.34315 20 8V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V8Z"
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
    </AuditIcon>
  );
}

export function CalendarClockIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="calendar-clock" {...props}>
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
    </AuditIcon>
  );
}

export function CheckmarkIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="checkmark-1" {...props}>
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ChevronDownSmallIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="chevron-down-small" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ChevronRightSmallIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="chevron-right-small" {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ChipIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="chip" {...props}>
      <path
        d="M8 5.5V4M12 5.5V4M16 5.5V4M8 20V18.5M12 20V18.5M16 20V18.5M9 15H15C15.5523 15 16 14.5523 16 14V10C16 9.44772 15.5523 9 15 9H9C8.44772 9 8 9.44772 8 10V14C8 14.5523 8.44772 15 9 15ZM7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function CircleInfoIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="circle-info" {...props}>
      <path
        d="M11 11H12V16M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.25C11.5858 7.25 11.25 7.58579 11.25 8C11.25 8.41421 11.5858 8.75 12 8.75C12.4142 8.75 12.75 8.41421 12.75 8C12.75 7.58579 12.4142 7.25 12 7.25Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </AuditIcon>
  );
}

export function ClockIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="clock" {...props}>
      <path
        d="M12 8V12L14.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function CreditCardIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="credit-card-1" {...props}>
      <path
        d="M3 10V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V10M3 10V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V10M3 10H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function CrossSmallIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="cross-small" {...props}>
      <path
        d="M8 8L16 16M16 8L8 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </AuditIcon>
  );
}

export function DevicesIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="devices" {...props}>
      <path
        d="M13 12C13 10.3431 14.3431 9 16 9H19C20.6569 9 22 10.3431 22 12V18C22 19.6569 20.6569 21 19 21H16C14.3431 21 13 19.6569 13 18V12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M20 9V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V16H2V17C2 18.6569 3.34315 20 5 20H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M4 16H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M17 18H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function FingerPrintIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="finger-print-1" {...props}>
      <path
        d="M6.40519 19.0481C6.58912 18.6051 6.75832 18.1545 6.91219 17.6969M14.3433 20.6926C14.6095 19.9418 14.8456 19.1768 15.0502 18.399C15.2359 17.6934 15.3956 16.9772 15.5283 16.2516M19.4477 17.0583C19.8121 15.0944 20.0026 13.0694 20.0026 11C20.0026 6.58172 16.4209 3 12.0026 3C10.7472 3 9.55932 3.28918 8.50195 3.80456M3.52344 15.0245C3.83663 13.7343 4.00262 12.3865 4.00262 11C4.00262 9.25969 4.55832 7.64917 5.50195 6.33621M12.003 11C12.003 13.7604 11.5557 16.4163 10.7295 18.8992C10.5169 19.5381 10.2792 20.1655 10.0176 20.7803M7.71227 14.5C7.90323 13.3618 8.00262 12.1925 8.00262 11C8.00262 8.79086 9.79348 7 12.0026 7C14.2118 7 16.0026 8.79086 16.0026 11C16.0026 11.6166 15.9834 12.2287 15.9455 12.8357"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function Folder1Icon(props: AuditIconProps) {
  return (
    <AuditIcon name="folder-1" {...props}>
      <path
        d="M3 7V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V10C21 8.34315 19.6569 7 18 7H13.0704C12.4017 7 11.7772 6.6658 11.4063 6.1094L10.5937 4.8906C10.2228 4.3342 9.59834 4 8.92963 4H6C4.34315 4 3 5.34315 3 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function HistoryIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="history" {...props}>
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
    </AuditIcon>
  );
}

export function Key2Icon(props: AuditIconProps) {
  return (
    <AuditIcon name="key-2" {...props}>
      <path
        d="M15.4 8.5H15.5H15.6M16 8.5C16 8.77614 15.7761 9 15.5 9C15.2239 9 15 8.77614 15 8.5C15 8.22386 15.2239 8 15.5 8C15.7761 8 16 8.22386 16 8.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 14C18.5376 14 21 11.5376 21 8.5C21 5.46243 18.5376 3 15.5 3C12.4624 3 10 5.46243 10 8.5C10 8.96094 10.0567 9.40863 10.1635 9.83649L4.87868 15.1213C4.31607 15.6839 4 16.447 4 17.2426V19C4 19.5523 4.44772 20 5 20H6.75736C7.55301 20 8.31607 19.6839 8.87868 19.1213L10 18V15.5H12.5L14.1635 13.8365C14.5914 13.9433 15.0391 14 15.5 14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function LockIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="lock" {...props}>
      <path
        d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function MagnifyingGlassIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="magnifying-glass" {...props}>
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
    </AuditIcon>
  );
}

export function PeopleIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="people" {...props}>
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
    </AuditIcon>
  );
}

export function PuzzleIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="puzzle" {...props}>
      <path
        d="M7 5H9.5V4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5V5H17C18.6569 5 20 6.34315 20 8V9.5H19.5C18.1193 9.5 17 10.6193 17 12C17 13.3807 18.1193 14.5 19.5 14.5H20V16C20 17.6569 18.6569 19 17 19H7C5.34315 19 4 17.6569 4 16V8C4 6.34315 5.34315 5 7 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ReviewStarIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="review-star-square" {...props}>
      <path
        d="M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M11.3075 7.9151C11.5637 7.29913 12.4363 7.29913 12.6925 7.9151L13.345 9.48385C13.453 9.74353 13.6972 9.92096 13.9775 9.94343L15.6711 10.0792C16.3361 10.1325 16.6058 10.9624 16.0991 11.3964L14.8088 12.5017C14.5952 12.6847 14.5019 12.9718 14.5672 13.2453L14.9614 14.898C15.1162 15.5469 14.4102 16.0598 13.8409 15.7121L12.3909 14.8264C12.1509 14.6798 11.8491 14.6798 11.6091 14.8264L10.1591 15.7121C9.58979 16.0598 8.88385 15.5469 9.03864 14.898L9.43286 13.2453C9.49812 12.9718 9.40484 12.6847 9.19125 12.5017L7.9009 11.3964C7.39425 10.9624 7.66389 10.1325 8.32888 10.0792L10.0225 9.94343C10.3028 9.92096 10.547 9.74353 10.655 9.48385L11.3075 7.9151Z"
        fill="currentColor"
      />
    </AuditIcon>
  );
}

export function RobotIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="robot" {...props}>
      <path
        d="M9 10C9 10.2761 8.77614 10.5 8.5 10.5C8.22386 10.5 8 10.2761 8 10M9 10C9 9.72386 8.77614 9.5 8.5 9.5C8.22386 9.5 8 9.72386 8 10M9 10H8M16 10C16 10.2761 15.7761 10.5 15.5 10.5C15.2239 10.5 15 10.2761 15 10M16 10C16 9.72386 15.7761 9.5 15.5 9.5C15.2239 9.5 15 9.72386 15 10M16 10H15M12 5V3M3.5 9C2.94772 9 2.5 9.44772 2.5 10C2.5 10.5523 2.94772 11 3.5 11M20.5 9C21.0523 9 21.5 9.44772 21.5 10C21.5 10.5523 21.0523 11 20.5 11M10 14.5H14M3.5 16V8C3.5 6.34315 4.84315 5 6.5 5H17.5C19.1569 5 20.5 6.34315 20.5 8V16C20.5 17.6569 19.1569 19 17.5 19H6.5C4.84315 19 3.5 17.6569 3.5 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function ServerIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="server" {...props}>
      <path
        d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V12H3V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M3 12H21V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M6.5 14.625C6.98325 14.625 7.375 15.0168 7.375 15.5C7.375 15.9832 6.98325 16.375 6.5 16.375C6.01675 16.375 5.625 15.9832 5.625 15.5C5.625 15.0168 6.01675 14.625 6.5 14.625ZM6.5 7.625C6.98325 7.625 7.375 8.01675 7.375 8.5C7.375 8.98325 6.98325 9.375 6.5 9.375C6.01675 9.375 5.625 8.98325 5.625 8.5C5.625 8.01675 6.01675 7.625 6.5 7.625Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.75"
      />
    </AuditIcon>
  );
}

export function SettingsGearIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="settings-gear-1" {...props}>
      <path
        d="M10.53 3.82729C11.4432 3.31361 12.5583 3.31361 13.4715 3.82729L18.4716 6.63977C19.4162 7.17112 20.0008 8.17067 20.0008 9.2545L20.0008 14.7454C20.0008 15.8292 19.4162 16.8288 18.4715 17.3601L13.4715 20.1726C12.5583 20.6863 11.4432 20.6863 10.53 20.1726L5.53008 17.3604C4.58539 16.8291 4.00077 15.8295 4.00077 14.7456L4.00077 9.25448C4.00077 8.17065 4.58536 7.17109 5.53 6.63974L10.53 3.82729Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M18.4708 6.63975L13.4708 3.82728C12.5575 3.3136 11.4425 3.3136 10.5292 3.82728L5.52924 6.63973C4.58459 7.17108 4 8.17064 4 9.25447V14.7456C4 15.8295 4.58463 16.8291 5.52931 17.3604L10.5293 20.1726C11.4425 20.6863 12.5575 20.6863 13.4707 20.1726L18.4708 17.3601C19.4154 16.8288 20 15.8292 20 14.7454V9.25449C20 8.17066 19.4154 7.17111 18.4708 6.63975Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </AuditIcon>
  );
}

export function SettingsSliderThreeIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="settings-slider-three" {...props}>
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
    </AuditIcon>
  );
}

export function SortArrowUpDownIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="sort-arrow-up-down" {...props}>
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
    </AuditIcon>
  );
}

export function TagIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="tag" {...props}>
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
    </AuditIcon>
  );
}

export function UserIcon(props: AuditIconProps) {
  return (
    <AuditIcon name="user" {...props}>
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
    </AuditIcon>
  );
}
