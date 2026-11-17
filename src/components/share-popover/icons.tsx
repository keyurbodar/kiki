import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

export type ShareIconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const square = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square",
} as const;

function Glyph({
  className,
  children,
  ...props
}: ShareIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-(--icon-base) shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ShareOsIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 6L12 2L16 6" {...stroke} />
      <path d="M12 3V13" {...stroke} />
      <path
        d="M17 10C18.1046 10 19 10.8954 19 12V17C19 18.6569 17.6569 20 16 20H8C6.34315 20 5 18.6569 5 17V12C5 10.8954 5.89543 10 7 10"
        {...stroke}
      />
    </Glyph>
  );
}

export function LockIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M5 13C5 11.3431 6.34315 10 8 10H16C17.6569 10 19 11.3431 19 13V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V13Z"
        {...stroke}
      />
      <path
        d="M16 9.5V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9.5"
        {...stroke}
      />
      <path d="M12 14V17" {...stroke} />
    </Glyph>
  );
}

export function UserGroupIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="9" r="3" {...stroke} />
      <circle cx="4" cy="9.5" r="2" {...stroke} />
      <circle cx="20" cy="9.5" r="2" {...stroke} />
      <path
        d="M10.0428 18C8.57631 18 7.22823 16.9033 7.56204 15.4752C8.01943 13.5185 9.48682 12 12.0014 12C14.5161 12 15.9835 13.5186 16.4408 15.4753C16.7746 16.9033 15.4266 18 13.96 18H10.0428Z"
        {...stroke}
      />
      <path
        d="M3.99878 16.9999H3.45795C2.02801 16.9999 0.655199 15.9269 1.10985 14.5712C1.53898 13.2916 2.57366 12.2942 3.99878 11.5698"
        {...stroke}
      />
      <path
        d="M20 17.0001H20.5406C21.9706 17.0001 23.3435 15.927 22.8888 14.5711C22.4596 13.2917 21.425 12.2944 20 11.5701"
        {...stroke}
      />
    </Glyph>
  );
}

export function GlobeIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        {...square}
      />
      <path
        d="M12 21C10.067 21 8.5 16.9706 8.5 12C8.5 7.02944 10.067 3 12 3C13.933 3 15.5 7.02944 15.5 12C15.5 16.9706 13.933 21 12 21Z"
        {...square}
      />
      <path d="M21 12H3" {...square} />
    </Glyph>
  );
}

export function CopyIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M9 9V5.25C9 4.00736 10.0074 3 11.25 3H18.75C19.9926 3 21 4.00736 21 5.25V12.75C21 13.9926 19.9926 15 18.75 15H15M12.75 9H5.25C4.00736 9 3 10.0074 3 11.25V18.75C3 19.9926 4.00736 21 5.25 21H12.75C13.9926 21 15 19.9926 15 18.75V11.25C15 10.0074 13.9926 9 12.75 9Z"
        {...stroke}
      />
    </Glyph>
  );
}

export function CheckmarkIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.75L10 19L19 5" {...stroke} />
    </Glyph>
  );
}

export function TrashCanIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
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
    </Glyph>
  );
}

export function ChevronRightSmallIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        {...stroke}
      />
    </Glyph>
  );
}

export function DotsHorizontalIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
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
    </Glyph>
  );
}

export function ArrowUpRightIcon(props: ShareIconProps) {
  return (
    <Glyph {...props}>
      <path d="M18 15V6M18 6H9M18 6L6.25 17.75" {...stroke} />
    </Glyph>
  );
}
