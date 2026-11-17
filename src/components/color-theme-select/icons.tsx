import type { SVGProps } from "react";

export type MenuIconProps = SVGProps<SVGSVGElement>;

function MenuIcon({ className, ...props }: MenuIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      className={className ?? "size-(--icon-sm)"}
      {...props}
    />
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CheckmarkIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="checkmark-1" {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </MenuIcon>
  );
}

export function ContrastIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="contrast" {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...stroke}
      />
      <path d="M12 3.5V20.5" {...stroke} />
      <path d="M15 4V20" {...stroke} />
      <path d="M18 5.5V18.5" {...stroke} />
    </MenuIcon>
  );
}

export function TrashCanIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="trash-can" {...props}>
      <path
        d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5"
        {...stroke}
      />
      <path d="M10 11V16" {...stroke} />
      <path d="M14 11V16" {...stroke} />
      <path d="M3.5 6H20.5" {...stroke} />
      <path
        d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621"
        {...stroke}
      />
    </MenuIcon>
  );
}

export function SettingsGearIcon(props: MenuIconProps) {
  const square = { ...stroke, strokeLinecap: "square" } as const;
  return (
    <MenuIcon data-icon="settings-gear-1" {...props}>
      <path
        d="M10.53 3.82729C11.4432 3.31361 12.5583 3.31361 13.4715 3.82729L18.4716 6.63977C19.4162 7.17112 20.0008 8.17067 20.0008 9.2545L20.0008 14.7454C20.0008 15.8292 19.4162 16.8288 18.4715 17.3601L13.4715 20.1726C12.5583 20.6863 11.4432 20.6863 10.53 20.1726L5.53008 17.3604C4.58539 16.8291 4.00077 15.8295 4.00077 14.7456L4.00077 9.25448C4.00077 8.17065 4.58536 7.17109 5.53 6.63974L10.53 3.82729Z"
        {...square}
      />
      <path
        d="M18.4708 6.63975L13.4708 3.82728C12.5575 3.3136 11.4425 3.3136 10.5292 3.82728L5.52924 6.63973C4.58459 7.17108 4 8.17064 4 9.25447V14.7456C4 15.8295 4.58463 16.8291 5.52931 17.3604L10.5293 20.1726C11.4425 20.6863 12.5575 20.6863 13.4707 20.1726L18.4708 17.3601C19.4154 16.8288 20 15.8292 20 14.7454V9.25449C20 8.17066 19.4154 7.17111 18.4708 6.63975Z"
        {...square}
      />
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        {...square}
      />
    </MenuIcon>
  );
}

export function BubbleQuestionIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="bubble-question" {...props}>
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
    </MenuIcon>
  );
}

export function ArrowsRepeatRightLeftIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="arrows-repeat-right-left" {...props}>
      <path
        d="M17.5 3L19.7929 5.29289C20.1834 5.68342 20.1834 6.31658 19.7929 6.70711L17.5 9"
        {...stroke}
      />
      <path
        d="M6.49985 21L4.20696 18.7071C3.81643 18.3166 3.81643 17.6834 4.20696 17.2929L6.49985 15"
        {...stroke}
      />
      <path d="M5 18H17C18.6569 18 20 16.6569 20 15V13" {...stroke} />
      <path d="M4 11V9C4 7.34315 5.34315 6 7 6H19" {...stroke} />
    </MenuIcon>
  );
}

export function PlusLargeIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="plus-large" {...props}>
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MenuIcon>
  );
}

export function DoorIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="door" {...props}>
      <path d="M3 21L21 21" {...stroke} />
      <path
        d="M5 21V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V21"
        {...stroke}
      />
      <path d="M8 12H9" {...stroke} />
    </MenuIcon>
  );
}

export function ChevronDownSmallIcon(props: MenuIconProps) {
  return (
    <MenuIcon data-icon="chevron-down-small" {...props}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        {...stroke}
      />
    </MenuIcon>
  );
}
