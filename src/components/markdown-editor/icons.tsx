import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { Icon, type IconId } from "@/primitives/icon";

const editorIconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-(--icon-xs)",
      sm: "size-(--icon-sm)",
      base: "size-(--icon-base)",
    },
  },
  defaultVariants: { size: "sm" },
});

const INLINE_ICONS = {
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
  "numbered-list": (
    <>
      <path
        d="M12 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.5V4.5L4 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 15C4.25 15 4.9 14.5 5.61102 14.5C6.37813 14.5 7 15.1219 7 15.889C7 17.6885 4 18 4 19.5H7.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  code: (
    <>
      <path
        d="M10 9.5L8.20711 11.2929C7.81658 11.6834 7.81658 12.3166 8.20711 12.7071L10 14.5M14 9.5L15.7929 11.2929C16.1834 11.6834 16.1834 12.3166 15.7929 12.7071L14 14.5M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  bold: (
    <>
      <path
        d="M6 9C6 10.6569 7.34315 12 9 12H13C15.2091 12 17 10.2091 17 8C17 5.79086 15.2091 4 13 4H9C7.34315 4 6 5.34315 6 7V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M13 12H14C16.2091 12 18 13.7909 18 16C18 18.2091 16.2091 20 14 20H9C7.34315 20 6 18.6569 6 17V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </>
  ),
  italic: (
    <>
      <path
        d="M10 4L14.5 4L19 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 4L9.5 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20H9.5L14 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "chain-link-1": (
    <>
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
    </>
  ),
  "bubble-wide": (
    <>
      <path
        d="M3.00195 7.00002C3.00195 5.34317 4.3451 4.00002 6.00195 4.00002L18.0019 4C19.6588 4 21.002 5.34314 21.002 7V15.0358C21.002 16.6926 19.6588 18.0357 18.002 18.0358L15.3757 18.0358C15.1427 18.0358 14.9171 18.1171 14.7377 18.2657L11.9977 20.5358L9.29398 18.2694C9.11393 18.1185 8.8865 18.0358 8.65157 18.0358H6.00195C4.3451 18.0358 3.00195 16.6926 3.00195 15.0358L3.00195 7.00002Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  ),
  "square-behind-square-2": (
    <>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
  "arrow-up": (
    <>
      <path
        d="M12 5V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10L12 4L18 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "arrow-down": (
    <>
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
    </>
  ),
  "arrow-left": (
    <>
      <path
        d="M10 6L4 12L10 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "arrow-right": (
    <>
      <path
        d="M14 6L20 12L14 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12H4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "trash-can": (
    <>
      <path
        d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 6H20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type EditorIconName = IconId | keyof typeof INLINE_ICONS;

export type EditorIconProps = VariantProps<typeof editorIconVariants> & {
  name: EditorIconName;
  className?: string;
};

const isInline = (name: EditorIconName): name is keyof typeof INLINE_ICONS =>
  name in INLINE_ICONS;

export function EditorIcon({ name, size, className }: EditorIconProps) {
  if (!isInline(name))
    return <Icon name={name} size={size ?? "sm"} className={className} />;
  return (
    <svg
      data-slot="icon"
      data-icon={name}
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={editorIconVariants({ size, className })}
    >
      {INLINE_ICONS[name]}
    </svg>
  );
}
