import type { SVGProps } from "react";
import { cx } from "./cx";

type MessageIconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function MessageIcon({
  name,
  className,
  children,
  ...props
}: MessageIconProps & { name: string; children: React.ReactNode }) {
  return (
    <svg
      data-slot="icon"
      data-icon={name}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cx("size-(--icon-base) shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function CopyIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="square-behind-square-2" {...props}>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        {...stroke}
      />
    </MessageIcon>
  );
}

export function CheckIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="checkmark-1" {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </MessageIcon>
  );
}

export function MoreIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="dot-grid-1x3-horizontal" {...props}>
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        {...stroke}
      />
      <path
        d="M20 13C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13Z"
        {...stroke}
      />
      <path
        d="M4 13C4.55228 13 5 12.5523 5 12C5 11.4477 4.55228 11 4 11C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13Z"
        {...stroke}
      />
    </MessageIcon>
  );
}

export function CalendarClockIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="calendar-clock" {...props}>
      <path
        d="M2.75879 10.1637L3.62703 15.0877C3.91474 16.7194 5.47072 17.8089 7.1024 17.5212L10.0972 16.9931M2.75879 10.1637L2.58514 9.17888C2.29743 7.5472 3.38694 5.99122 5.01862 5.70351L11.9123 4.48797C13.544 4.20026 15.0999 5.28977 15.3876 6.92145C15.4835 7.46535 15.1204 7.984 14.5765 8.07991L2.75879 10.1637Z"
        {...stroke}
      />
      <path
        d="M16 20C19.3137 20 22 17.3137 22 14C22 10.6863 19.3137 8 16 8C12.6863 8 10 10.6863 10 14C10 17.3137 12.6863 20 16 20Z"
        {...stroke}
      />
      <path d="M16 12V14L17.6667 15.6667" {...stroke} />
    </MessageIcon>
  );
}

export function ClockIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="clock" {...props}>
      <path
        d="M12 8V12L14.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...stroke}
      />
    </MessageIcon>
  );
}

export function BranchIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="branch" {...props}>
      <circle cx="6.5" cy="6" r="2" {...stroke} />
      <circle cx="6.5" cy="18" r="2" {...stroke} />
      <circle cx="17.5" cy="6" r="2" {...stroke} />
      <path d="M6.5 8V16" {...stroke} />
      <path
        d="M17.5 8V9C17.5 10.6569 16.1569 12 14.5 12H9.5C7.84315 12 6.5 13.3431 6.5 15V16"
        {...stroke}
      />
    </MessageIcon>
  );
}

export function SummaryIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="summary" {...props}>
      <path d="M4 6V14C4 15.6569 5.34315 17 7 17H18" {...stroke} />
      <path d="M9 7H17" {...stroke} />
      <path d="M9 12H13" {...stroke} />
      <path d="M18 19V15L20.5 17L18 19Z" {...stroke} />
    </MessageIcon>
  );
}

export function ChatBubbleIcon(props: MessageIconProps) {
  return (
    <MessageIcon name="chat-bubble-7" {...props}>
      <path
        d="M12 20.5C16.9706 20.5 21 16.6944 21 12C21 7.30558 16.9706 3.5 12 3.5C7.02944 3.5 3 7.30558 3 12C3 13.4501 3.38446 14.8153 4.06236 16.0098C4.49657 16.7749 4.76387 17.6571 4.51434 18.5007C4.36519 19.0049 4.19064 19.5036 4 20C4.82664 19.949 5.62116 19.8458 6.39429 19.6881C7.15602 19.5328 7.94695 19.6275 8.67469 19.901C9.70341 20.2875 10.8254 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </MessageIcon>
  );
}
